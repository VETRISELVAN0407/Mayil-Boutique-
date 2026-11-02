import { useEffect, useState } from 'react';
import * as categoryService from '../services/categoryService';
import * as productService from '../services/productService';
import { indexById, normalizeCategories, normalizeProduct } from '../utils/catalog';

let categoriesPromise = null;

function loadCategories() {
  if (!categoriesPromise) {
    categoriesPromise = categoryService.getPublicCategories().then(normalizeCategories).catch((error) => {
      categoriesPromise = null;
      throw error;
    });
  }
  return categoriesPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let active = true;
    loadCategories()
      .then((data) => active && setCategories(data ?? []))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, []);
  return categories;
}

/** Published products (optionally filtered), normalised for display. */
export function useProducts({ categoryId, search } = {}) {
  const categories = useCategories();
  const [state, setState] = useState({ loading: true, error: null, products: [] });

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    productService
      .getPublicProducts({ categoryId: categoryId || undefined, search: search || undefined })
      .then((data) => active && setState({ loading: false, error: null, products: data ?? [] }))
      .catch(() => active && setState({ loading: false, error: 'Could not load products.', products: [] }));
    return () => {
      active = false;
    };
  }, [categoryId, search]);

  const byId = indexById(categories);
  return {
    loading: state.loading,
    error: state.error,
    categories,
    products: state.products.map((p) => normalizeProduct(p, byId)),
  };
}
