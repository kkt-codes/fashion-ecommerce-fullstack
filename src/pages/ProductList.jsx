import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductFilter from "../components/ProductFilter";
import { useFetchCached, invalidateCacheEntry } from "../hooks/useFetchCached";
import { InboxIcon as EmptyProductStateIcon } from "@heroicons/react/24/outline";
import apiClient from "../services/api"; // For fetching categories and price range separately

const PRODUCTS_PER_PAGE = 16;

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState("name-asc");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // State for filter metadata
  const [categories, setCategories] = useState(["All"]); // Initialize with "All"
  const [minPossiblePrice, setMinPossiblePrice] = useState(0);
  const [maxPossiblePrice, setMaxPossiblePrice] = useState(1000); // Default
  const [filterMetaLoading, setFilterMetaLoading] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/products/categories');
        setCategories(['All', ...response.data.sort()]);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Keep default or set to empty + All
        setCategories(["All"]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch price range metadata from backend
  useEffect(() => {
    const fetchPriceRange = async () => {
      try {
        const response = await apiClient.get('/products/price-range-meta');
        if (response.data) {
          setMinPossiblePrice(Math.floor(response.data.minPrice) || 0);
          setMaxPossiblePrice(Math.ceil(response.data.maxPrice) || 1000);
        }
      } catch (error) {
        console.error("Error fetching price range metadata:", error);
      } finally {
        setFilterMetaLoading(false); // Combined loading state for filter metadata
      }
    };
    fetchPriceRange();
  }, []);


  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", currentPage.toString());
    params.append("size", PRODUCTS_PER_PAGE.toString());

    if (selectedCategory !== "All") {
      params.append("category", selectedCategory);
    }
    if (searchTerm.trim() !== "") {
      params.append("searchTerm", searchTerm.trim());
    }
    if (priceRange.min !== '' && !isNaN(parseFloat(priceRange.min))) {
      params.append("minPrice", parseFloat(priceRange.min).toString());
    }
    if (priceRange.max !== '' && !isNaN(parseFloat(priceRange.max))) {
      params.append("maxPrice", parseFloat(priceRange.max).toString());
    }
    if (ratingFilter > 0) {
      params.append("minRating", ratingFilter.toString());
    }
    
    const [sortBy, sortDir] = sortOption.split('-');
    if (sortBy && sortDir) {
      params.append("sortBy", sortBy);
      params.append("sortDir", sortDir.toUpperCase());
    } else if (sortOption === 'default') { // Handle 'default' explicitly if needed
        params.append("sortBy", "name"); 
        params.append("sortDir", "ASC");
    }

    return `/products?${params.toString()}`;
  }, [currentPage, selectedCategory, searchTerm, priceRange, sortOption, ratingFilter]);

  const [apiUrl, setApiUrl] = useState(buildApiUrl());

  useEffect(() => {
    setApiUrl(buildApiUrl());
  }, [buildApiUrl]);

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    forceRefetch: refetchProductsFromHook
  } = useFetchCached(`products-${apiUrl}`, apiUrl, {
     // cacheDuration: 1 * 60 * 1000 
  });
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchFromQuery = queryParams.get('search');
    const categoryFromQuery = queryParams.get('category');

    if (searchFromQuery) setSearchTerm(searchFromQuery);
    else setSearchTerm(''); 

    if (categoryFromQuery && categories.length > 1 && categories.includes(categoryFromQuery)) { // categories includes "All"
        setSelectedCategory(categoryFromQuery);
    } else if (!categoryFromQuery && categories.length > 0) {
        // setSelectedCategory("All"); // Or keep current if not in URL
    }
    // setCurrentPage(0); // Reset page when URL search params change directly
  }, [location.search, categories]);


  const products = useMemo(() => productsData?.content || [], [productsData]);
  const totalPages = useMemo(() => productsData?.totalPages || 0, [productsData]);
  const totalElements = useMemo(() => productsData?.totalElements || 0, [productsData]);

  const forceRefetch = useCallback(() => {
    invalidateCacheEntry(`products-${apiUrl}`);
    refetchProductsFromHook(); 
  }, [apiUrl, refetchProductsFromHook]);


  const paginate = (pageNumber) => { 
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setCurrentPage(pageNumber);
      
      const productListTop = document.getElementById('product-list-section');
      if (productListTop) {
        const headerOffset = document.querySelector('nav')?.offsetHeight || 70; 
        const elementPosition = productListTop.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 20; 
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      } else {
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    }
  };
  
  const handleResetAllFilters = () => {
    setSelectedCategory("All");
    setSearchTerm("");
    setPriceRange({ min: '', max: '' });
    setSortOption("name-asc"); 
    setRatingFilter(0);
    setCurrentPage(0); 
    navigate(location.pathname, { replace: true }); 
  };
  
  useEffect(() => {
    setCurrentPage(0); 
  }, [selectedCategory, searchTerm, priceRange, sortOption, ratingFilter]);

  // Combined loading state for initial page render
  const initialDataLoading = productsLoading && !productsData && filterMetaLoading;

  if (initialDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] bg-gray-50">
        <p className="text-gray-600 text-xl animate-pulse">Loading products and filters...</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] bg-gray-50 text-center px-4">
        <h2 className="text-2xl font-semibold text-red-600 mb-3">Oops! Something went wrong.</h2>
        <p className="text-gray-700 mb-2">We couldn't load the products at this time.</p>
        <p className="text-sm text-gray-500 mb-6">Error: {productsError.message} (Status: {productsError.status})</p>
        <button
          onClick={forceRefetch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  const headerHeight = "4rem"; 

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
          />
        </div>
        
        <div id="product-list-section" className="flex flex-col md:flex-row md:gap-8 relative">
          <aside 
            className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 md:sticky self-start mb-8 md:mb-0"
            style={{ top: `calc(${headerHeight} + 1rem)` }} 
          >
            {filterMetaLoading ? (
                <p className="p-6 text-center text-gray-500">Loading filters...</p>
            ) : (
                <ProductFilter
                  categories={categories} 
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  minPossiblePrice={minPossiblePrice} 
                  maxPossiblePrice={maxPossiblePrice} 
                  ratingFilter={ratingFilter}
                  setRatingFilter={setRatingFilter}
                  onResetFilters={handleResetAllFilters}
                />
            )}
          </aside>

          <main 
            id="product-grid-container" 
            className="w-full md:w-2/3 lg:w-3/4 xl:w-4/5"
            >
            {productsLoading && <p className="text-center text-gray-500 py-4">Updating results...</p>}
            {!productsLoading && products.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {productsData?.pageable?.offset + 1} - 
                  {productsData?.pageable?.offset + productsData?.numberOfElements} of {totalElements} products
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 mb-4 py-4 border-t border-gray-200" aria-label="Pagination">
                    <p className="text-sm text-gray-700">
                      Page {productsData?.number + 1} of {totalPages} 
                    </p>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => paginate(0)}
                        disabled={currentPage === 0}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        First
                      </button>
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      {/* Dynamic Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i).map(pageIndex => {
                          // Logic to show limited page numbers e.g., first, last, current, and 2 around current
                          const showPage = totalPages <= 7 || // Show all if 7 or less
                                           pageIndex === currentPage || // Current page
                                           (pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1) || // Pages around current
                                           pageIndex === 0 || pageIndex === totalPages - 1; // First and last

                          const showEllipsisBefore = pageIndex === currentPage - 2 && currentPage > 2 && pageIndex !== 0;
                          const showEllipsisAfter = pageIndex === currentPage + 2 && currentPage < totalPages - 3 && pageIndex !== totalPages - 1;
                          
                          if (showEllipsisBefore && !(pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1) && pageIndex !== 0 ) {
                              return <span key={`ellipsis-start-${pageIndex}`} className="px-3 py-1.5 text-sm">...</span>;
                          }
                          if (showPage) {
                            return (
                                <button
                                key={pageIndex}
                                onClick={() => paginate(pageIndex)}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-md ${
                                    currentPage === pageIndex
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                                >
                                {pageIndex + 1}
                                </button>
                            );
                          }
                          if (showEllipsisAfter && !(pageIndex >= currentPage - 1 && pageIndex <= currentPage + 1) && pageIndex !== totalPages -1) {
                              return <span key={`ellipsis-end-${pageIndex}`} className="px-3 py-1.5 text-sm">...</span>;
                          }
                          return null;
                        })}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                      <button
                        onClick={() => paginate(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Last
                      </button>
                    </div>
                  </nav>
                )}
              </>
            ) : (
              <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow-md">
                <EmptyProductStateIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-700">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria, or <button onClick={handleResetAllFilters} className="text-blue-600 hover:underline">reset all filters</button>.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
