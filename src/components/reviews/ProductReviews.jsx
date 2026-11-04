import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as reviewService from '../../services/reviewService';
import { errorMessage } from '../../utils/catalog';

const SORTS = [
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'latest', label: 'Latest' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
];
const RATING_LABELS = ['', 'Awful', 'Poor', 'Fair', 'Good', 'Awesome'];
const GOLD = '#E3A52B';

function Star({ filled, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? GOLD : '#e4dccb'} aria-hidden="true">
      <path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z" />
    </svg>
  );
}

function Stars({ value, size }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} filled={n <= Math.round(value)} size={size} />)}
    </span>
  );
}

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function RatingPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star filled={n <= value} size={32} />
        </button>
      ))}
      {value > 0 && <span className="ml-2 font-serif text-[#0f3d2e]">{RATING_LABELS[value]}</span>}
    </div>
  );
}

function ReviewForm({ product, existing, onSaved, onCancel }) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please choose a star rating.');
      return;
    }
    setSaving(true);
    try {
      const body = { productId: product.id, rating, comment };
      if (existing) await reviewService.updateReview(existing.id, body);
      else await reviewService.createReview(body);
      toast.success(existing ? 'Review updated.' : 'Thank you for your review!');
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save your review.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[#E3BF72]/60 bg-[#fdf8ee] p-5">
      <p className="font-serif text-lg text-[#0f3d2e]">{existing ? 'Edit your review' : 'Write a review'}</p>
      <div className="mt-3"><RatingPicker value={rating} onChange={setRating} /></div>
      <label htmlFor="review-comment" className="mt-4 block text-xs font-semibold uppercase tracking-widest text-[#8a6d2f]">
        Your experience (optional)
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="How were the fabric, fit and finish?"
        className="input-cream mt-1.5 w-full"
      />
      <p className="mt-1 text-right text-xs text-brand-secondary">{comment.length}/1000</p>
      <div className="mt-3 flex gap-3">
        <button type="submit" disabled={saving} className="btn-green px-6 py-2.5">{saving ? 'Saving…' : existing ? 'Update review' : 'Submit review'}</button>
        <button type="button" onClick={onCancel} className="btn-green-outline px-6 py-2.5">Cancel</button>
      </div>
    </form>
  );
}

function ReviewCard({ review, onHelpful, onEdit, onDelete }) {
  return (
    <article className="border-t border-[#E8E0D3] py-5 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        <Stars value={review.rating} />
        <span className="font-semibold text-[#0f5a3f]">{review.rating}.0</span>
        <span className="text-brand-secondary">•</span>
        <span className="font-serif text-[#10241d]">{RATING_LABELS[review.rating]}</span>
      </div>
      {(review.colour || review.size) && (
        <p className="mt-1.5 text-sm text-brand-secondary">
          Review for:{review.colour ? ` Colour ${review.colour}` : ''}{review.colour && review.size ? ' •' : ''}{review.size ? ` Size ${review.size}` : ''}
        </p>
      )}
      {review.comment && <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-[#2d2d26]">{review.comment}</p>}
      <p className="mt-3 text-sm text-brand-secondary">{review.reviewerName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {review.mine ? (
          <>
            <button onClick={onEdit} className="rounded-full border border-[#d8cdb4] px-4 py-1.5 text-sm text-[#0f3d2e] hover:bg-[#fdf8ee]">Edit</button>
            <button onClick={onDelete} className="rounded-full border border-brand-sale/40 px-4 py-1.5 text-sm text-brand-sale hover:bg-brand-sale/5">Delete</button>
            {review.helpfulCount > 0 && <span className="text-sm text-brand-secondary">Helpful for {review.helpfulCount}</span>}
          </>
        ) : (
          <button
            onClick={() => onHelpful(review)}
            aria-pressed={review.helpfulByMe}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
              review.helpfulByMe ? 'border-[#0f5a3f] bg-[#0f5a3f]/10 font-semibold text-[#0f5a3f]' : 'border-[#d8cdb4] text-[#4a4a3f] hover:bg-[#fdf8ee]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={review.helpfulByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 11v9H4v-9zM7 11l4-8c1.7 0 2.6 1.2 2.2 2.8L12.6 9H19a2 2 0 0 1 2 2.4l-1.3 6.2A2.5 2.5 0 0 1 17.3 20H7" />
            </svg>
            {review.helpfulCount > 0 ? `Helpful for ${review.helpfulCount}` : 'Helpful'}
          </button>
        )}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-brand-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#0f5a3f" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Verified Purchase · {timeAgo(review.createdAt)}
      </p>
    </article>
  );
}

export default function ProductReviews({ product }) {
  const { customer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sort, setSort] = useState('helpful');
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await reviewService.getReviews(product.slug, sort));
      setError(false);
    } catch {
      setError(true);
    }
  }, [product.slug, sort, customer]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleHelpful(review) {
    if (!customer) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      const result = await reviewService.toggleHelpful(review.id);
      setData((d) => ({
        ...d,
        reviews: d.reviews.map((r) => (r.id === review.id ? { ...r, helpfulCount: result.helpfulCount, helpfulByMe: result.helpfulByMe } : r)),
      }));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your review?')) return;
    try {
      await reviewService.deleteReview(data.myReview.id);
      toast.success('Review deleted.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (error) return null; // reviews are a bonus: never break the product page
  const total = data?.count ?? 0;
  const maxCount = Math.max(1, ...(data?.distribution ?? [0]));

  let action = null;
  if (data) {
    if (formOpen) {
      action = <ReviewForm product={product} existing={data.myReview} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />;
    } else if (data.canReview) {
      action = <button onClick={() => setFormOpen(true)} className="btn-green px-6 py-2.5">Write a review</button>;
    } else if (!data.myReview) {
      action = (
        <p className="text-sm text-brand-secondary">
          {customer
            ? 'Only customers who have received this product can review it.'
            : <>Only customers who have bought and received this product can review it. <Link to="/login" state={{ from: location.pathname }} className="text-[#0f5a3f] underline">Sign in</Link></>}
        </p>
      );
    }
  }

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-14 border-t border-[#E3BF72]/50 pt-10">
      <h2 id="reviews-heading" className="font-serif text-2xl text-[#0f3d2e] sm:text-3xl">Ratings &amp; Reviews</h2>

      {!data ? (
        <div className="skeleton mt-6 h-40 w-full max-w-3xl" />
      ) : (
        <>
          {total > 0 && (
            <div className="mt-6 grid max-w-3xl grid-cols-1 gap-6 rounded-xl bg-white p-5 shadow-card sm:grid-cols-[14rem_1fr] sm:gap-8">
              <div className="flex flex-col items-center justify-center sm:border-r sm:border-[#E8E0D3] sm:pr-6">
                <p className="font-serif text-5xl font-semibold text-[#0f3d2e]">{data.average.toFixed(1)}</p>
                <div className="mt-2"><Stars value={data.average} size={24} /></div>
                <p className="mt-2 text-sm text-brand-secondary">{total} {total === 1 ? 'review' : 'reviews'}</p>
              </div>
              <ul className="space-y-1.5 self-center">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = data.distribution[n - 1] ?? 0;
                  return (
                    <li key={n} className="flex items-center gap-3 text-sm">
                      <span className="w-8 flex-shrink-0 text-[#10241d]">{n} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8e3d6]">
                        <span className="block h-full rounded-full bg-[#0f8a3e] transition-[width] duration-500" style={{ width: `${(c / maxCount) * 100}%` }} />
                      </span>
                      <span className="w-8 flex-shrink-0 text-right text-brand-secondary">{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-6 max-w-3xl">{action}</div>

          {data.myReview && !formOpen && (
            <div className="mt-6 max-w-3xl rounded-xl border border-[#E3BF72]/60 bg-[#fdf8ee] px-5">
              <p className="pt-4 text-xs font-semibold uppercase tracking-widest text-[#8a6d2f]">Your review</p>
              <ReviewCard review={data.myReview} onEdit={() => setFormOpen(true)} onDelete={handleDelete} onHelpful={() => {}} />
            </div>
          )}

          {total === 0 ? (
            <p className="mt-6 text-brand-secondary">No reviews yet. Be the first to review this product after it is delivered.</p>
          ) : (
            <div className="mt-8 max-w-3xl">
              <p className="font-serif text-lg text-[#10241d]">User reviews sorted by</p>
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" role="group" aria-label="Sort reviews">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    aria-pressed={sort === s.value}
                    className={`flex-shrink-0 rounded-full border px-5 py-2 text-sm transition-colors ${
                      sort === s.value ? 'border-[#0f3d2e] bg-[#0f3d2e] text-white' : 'border-[#d8cdb4] bg-white text-[#10241d] hover:bg-[#fdf8ee]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-xl bg-white px-5 shadow-card">
                {data.reviews.filter((r) => !r.mine).length === 0 ? (
                  <p className="py-5 text-sm text-brand-secondary">Only your review so far.</p>
                ) : (
                  data.reviews.filter((r) => !r.mine).map((r) => <ReviewCard key={r.id} review={r} onHelpful={handleHelpful} />)
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
