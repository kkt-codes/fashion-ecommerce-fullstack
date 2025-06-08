import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InboxIcon } from "@heroicons/react/24/outline";

import ProductCard from "../components/ProductCard";
import ProductFilter from "../components/ProductFilter";
import { getProducts, getProductCategories, getProductPriceRange } from "../services/api";

const PRODUCTS_PER_PAGE = 16;

// Helper to get filter state from URL query params
const getFiltersFromURL = (search) => {
  const queryParams = new URLSearchParams(search);
  return {
    category: queryParams.get('category') || "All",
    search: queryParams.get('search') || "",
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    sort: queryParams.get('sort') || "name-asc",
    rating: Number(queryParams.get('rating')) || 0,
    page: Number(queryParams.get('page')) || 0,
  };
};

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(() => getFiltersFromURL(location.search));
  const [currentPage, setCurrentPage] = useState(() => getFiltersFromURL(location.search).page);

  const [categories, setCategories] = useState(["All"]);
  const [priceRangeMeta, setPriceRangeMeta] = useState({ min: 0, max: 1000 });
  const [isMetaLoading, setIsMetaLoading] = useState(true);

  const [productsData, setProductsData] = useState({ content: [], totalPages: 0, totalElements: 0, number: 0, pageable: { offset: 0 }, numberOfElements: 0 });
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    const fetchFilterMetadata = async () => {
      setIsMetaLoading(true);
      try {
        const [categoriesRes, priceRangeRes] = await Promise.all([
          getProductCategories(),
          getProductPriceRange()
        ]);
        setCategories(['All', ...categoriesRes.data.sort()]);
        setPriceRangeMeta({
          min: Math.floor(priceRangeRes.data.minPrice) || 0,
          max: Math.ceil(priceRangeRes.data.maxPrice) || 1000,
        });
      } catch (error) {
        console.error("Error fetching filter metadata:", error);
      } finally {
        setIsMetaLoading(false);
      }
    };
    fetchFilterMetadata();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category !== 'All') params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.rating !== 0) params.set('rating', filters.rating);
    if (filters.sort !== 'name-asc') params.set('sort', filters.sort);
    if (currentPage > 0) params.set('page', currentPage);
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [filters, currentPage, navigate, location.pathname]);


  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);
    setProductsError(null);

    const [sortBy, sortDir] = filters.sort.split('-');
    
    const apiParams = {
      page: currentPage,
      size: PRODUCTS_PER_PAGE,
      searchTerm: filters.search,
      category: filters.category === 'All' ? null : filters.category,
      minPrice: filters.minPrice || null,
      maxPrice: filters.maxPrice || null,
      // FIX: Handle the new rating filter logic
      // Send minRating only if it's a positive number (1, 2, 3, 4)
      minRating: filters.rating > 0 ? filters.rating : null,
      // Send a new parameter if the user wants to see products with no reviews
      noReviews: filters.rating === -1 ? true : null,
      sortBy: sortBy,
      sortDir: sortDir.toUpperCase(),
    };

    // Clean up null/empty values from params object before sending
    Object.keys(apiParams).forEach(key => (apiParams[key] == null || apiParams[key] === '') && delete apiParams[key]);

    try {
      const { data } = await getProducts(apiParams);
      setProductsData(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProductsError(error.response?.data || error);
    } finally {
      setIsProductsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const handleFilterChange = (newFilters) => {
    setCurrentPage(0);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetAllFilters = () => {
    setCurrentPage(0);
    setFilters({ category: 'All', search: '', minPrice: '', maxPrice: '', sort: 'name-asc', rating: 0 });
  };
  
  const handlePaginate = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < productsData.totalPages) {
      setCurrentPage(pageNumber);
      const productListTop = document.getElementById('product-list-section');
      if (productListTop) {
        const headerOffset = document.querySelector('nav')?.offsetHeight || 70;
        const elementPosition = productListTop.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 20;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }
  };
  
  const { products, totalPages, totalElements } = useMemo(() => ({
      products: productsData?.content || [],
      totalPages: productsData?.totalPages || 0,
      totalElements: productsData?.totalElements || 0,
  }), [productsData]);

  // ... The rest of your JSX for this component remains the same ...
  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">Our Products</h1>
          <p className="mt-3 text-lg text-gray-600">Browse our extensive collection.</p>
        </div>

        <div className="mb-8 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search by product name or description..."
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
          />
        </div>
        
        <div id="product-list-section" className="flex flex-col md:flex-row md:gap-8 relative">
          <aside 
            className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 md:sticky self-start mb-8 md:mb-0"
            style={{ top: '5rem' }} 
          >
            <ProductFilter
              categories={categories}
              filters={filters}
              setFilters={handleFilterChange}
              priceRangeMeta={priceRangeMeta}
              onResetFilters={handleResetAllFilters}
            />
          </aside>

          <main id="product-grid-container" className="w-full md:w-2/3 lg:w-3/4 xl:w-4/5">
            {isProductsLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
                        <div className="bg-gray-300 h-48 rounded-md mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                 ))}
               </div>
            ) : products.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {productsData.pageable.offset + 1} - {productsData.pageable.offset + productsData.numberOfElements} of {totalElements} products
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 mb-4 py-4 border-t border-gray-200" aria-label="Pagination">
                    <p className="text-sm text-gray-700">
                      Page {productsData.number + 1} of {totalPages} 
                    </p>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handlePaginate(0)} disabled={currentPage === 0} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">First</button>
                      <button onClick={() => handlePaginate(currentPage - 1)} disabled={currentPage === 0} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
                      {/* Pagination numbers can be added here if needed */}
                      <button onClick={() => handlePaginate(currentPage + 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
                      <button onClick={() => handlePaginate(totalPages - 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Last</button>
                    </div>
                  </nav>
                )}
              </>
            ) : (
              <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow-md">
                <InboxIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-700">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your filters, or <button onClick={handleResetAllFilters} className="text-blue-600 hover:underline">reset all filters</button>.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}