const GOLD = '#E3BF72';

const MESSAGES = [
  {
    text: 'Free Shipping on Orders Above ₹999',
    icon: <path d="M2 6h12v10H2zM14 9h4l3 3v4h-7M6 19a1.6 1.6 0 1 0 0-.01M17 19a1.6 1.6 0 1 0 0-.01" />,
  },
  {
    text: 'Easy 7-Day Returns',
    icon: <path d="M3 12 12 3h9v9l-9 9zM16.5 7.5h.01" />,
  },
  {
    text: 'Crafted with Care in India',
    icon: <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" fill={GOLD} />,
  },
];

export default function AnnouncementBar() {
  return (
    <div className="flex items-center justify-center gap-4 bg-[#0d3a2c] px-4 py-2.5 text-xs sm:text-[0.7812rem] text-[#F4EBDA]">
      <span className="hidden h-px w-24 bg-[#E3BF72]/70 md:block" />
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {MESSAGES.map((m, i) => (
          <li key={m.text} className={`items-center gap-4 ${i === 0 ? 'flex' : 'hidden sm:flex'}`}>
            {i > 0 && <span className="hidden h-3.5 w-px bg-[#E3BF72]/50 sm:block" />}
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                {m.icon}
              </svg>
              {m.text}
            </span>
          </li>
        ))}
      </ul>
      <span className="hidden h-px w-24 bg-[#E3BF72]/70 md:block" />
    </div>
  );
}
