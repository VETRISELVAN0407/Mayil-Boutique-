import { useParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog';
import ProductCard from '../components/ui/ProductCard';
import PageShell, { EmptyPanel } from '../components/ui/PageShell';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton';

export default function CategoryPage() {
  const { slug } = useParams();
  const categories = useCategories();
  const category = categories.find((c) => c.slug === slug);
  const { products, loading } = useProducts({ categoryId: category?.id });

  if (categories.length === 0) {
    return (
      <PageShell crumb="Collection" title="Collection">
        <ProductGridSkeleton count={8} />
      </PageShell>
    );
  }

  if (!category) {
    return (
      <PageShell crumb="Collection" title="Not found">
        <EmptyPanel
          title="Category not found"
          description="This category does not exist or may have moved."
          actionLabel="Browse all products"
          actionTo="/products"
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      crumb={category.name}
      title={category.name}
      subtitle={loading ? category.description : `${products.length} ${products.length === 1 ? 'piece' : 'pieces'} to discover`}
    >
      {!loading && category.description && (
        <p className="-mt-4 mb-8 max-w-2xl font-serif text-base italic text-[#4a4a3f] sm:text-lg">{category.description}</p>
      )}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyPanel
          title="Coming soon"
          description="We are adding new products to this collection. Check back soon!"
          actionLabel="Browse all products"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
