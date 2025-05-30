import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductFilter from "../components/ProductFilter";
// Removed useFetchCached
import { InboxIcon as EmptyProductStateIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_BASE_URL = 'http://localhost:8080/api';
const PRODUCTS_PER_PAGE = 16; // Adjust as needed, should align with backend default or be passed

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();

  // State for fetched products and API response details
  const [products, setProducts] = useState([]); // products from current page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // 1-indexed for UI

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortOption, setSortOption] = useState("default"); // e.g., "price-asc", "name-desc"
  const [ratingFilter, setRatingFilter] = useState(0); // 0 for All

  // Categories for the filter - derived from a broader product fetch or a dedicated endpoint
  const [availableCategories, setAvailableCategories] = useState([]);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTerm]);
  

  // Function to parse sortOption into sortBy and sortDir for API
  const parseSortOption = (option) => {
    if (option === "default") return { sortBy: 'name', sortDir: 'ASC' }; // Default sort by backend
    const parts = option.split('-');
    const sortBy = parts[0] === 'rating' ? 'averageRating' : parts[0]; // Map 'rating' to 'averageRating'
    const sortDir = parts[1].toUpperCase();
    return { sortBy, sortDir };
  };

  // Fetch products from backend
  const fetchProducts = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    params.append('page', pageToFetch - 1); // Backend is 0-indexed
    params.append('size', PRODUCTS_PER_PAGE);

    if (selectedCategory !== "All") {
      params.append('category', selectedCategory);
    }
    if (debouncedSearchTerm.trim()) {
      params.append('searchTerm', debouncedSearchTerm.trim());
    }
    if (priceRange.min !== '') {
      params.append('minPrice', priceRange.min);
    }
    if (priceRange.max !== '') {
      params.append('maxPrice', priceRange.max);
    }
    if (ratingFilter > 0) { // Assuming 0 means no rating filter
      params.append('minRating', ratingFilter);
    }
    
    const { sortBy, sortDir } = parseSortOption(sortOption);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortDir) params.append('sortDir', sortDir);

    try {
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Failed to fetch products."}));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      const data = await response.json(); // Expects Page<ProductDto>
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(data.number + 1); // Convert 0-indexed from backend to 1-indexed for UI

      // Update URL with current filters without causing a page reload for better UX
      // Only update if params actually changed from URL to avoid loop
      const currentSearchParams = new URLSearchParams(location.search);
      let shouldUpdateURL = false;
      params.forEach((value, key) => {
        if (key !== 'page' && key !== 'size' && currentSearchParams.get(key) !== value) {
            shouldUpdateURL = true;
        }
      });
      if (shouldUpdateURL || !location.search) { // Update if params changed or no params initially
          navigate(`${location.pathname}?${params.toString()}`, { replace: true, state: { fromProductList: true } });
      }


    } catch (err) {
      console.error("ProductList: Failed to fetch products:", err);
      setError(err.message);
      setProducts([]);
      setTotalPages(0);
      toast.error(err.message || "Could not load products.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, debouncedSearchTerm, priceRange, sortOption, ratingFilter, navigate, location.pathname, location.search]);

  // Fetch initial categories (e.g., from all products or a dedicated endpoint)
  // This should ideally come from a dedicated /api/categories endpoint.
  // For now, we'll fetch all products once to derive categories. This is not optimal for many products.
  useEffect(() => {
    const fetchAllCategories = async () => {
        try {
            // Fetch a large number of products to get a good representation of categories
            // Or better, use a dedicated categories endpoint if available
            const response = await fetch(`${API_BASE_URL}/products?page=0&size=200`); // Fetch up to 200 to derive categories
            if(!response.ok) throw new Error("Could not fetch categories");
            const data = await response.json();
            if (data.content) {
                const uniqueCategories = [...new Set(data.content.map(p => p.category))].sort();
                setAvailableCategories(uniqueCategories);
            }
        } catch (catError) {
            console.error("Error fetching categories:", catError);
            toast.error("Could not load filter categories.");
        }
    };
    fetchAllCategories();
  }, []);


  // Effect to handle URL query parameters on initial load and changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setSearchTerm(queryParams.get('search') || "");
    const categoryFromQuery = queryParams.get('category');
    if (categoryFromQuery && (availableCategories.includes(categoryFromQuery) || categoryFromQuery === "All")) {
        setSelectedCategory(categoryFromQuery);
    } else if (!categoryFromQuery) {
        setSelectedCategory("All");
    }
    // Other filters can be parsed similarly if added to URL
    // Price, sort, rating...
    
    // Don't fetch here if location.state.fromProductList is true, means fetchProducts already ran
    if (!location.state?.fromProductList) {
        fetchProducts(currentPage);
    }
    // Clear the state after use
    if (location.state?.fromProductList) {
        navigate(location.pathname + location.search, { replace: true, state: {} });
    }

  }, [location.search, availableCategories, fetchProducts, currentPage, navigate, location.state]);
  

  // Trigger fetchProducts when filters or page change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [selectedCategory, debouncedSearchTerm, priceRange, sortOption, ratingFilter, currentPage, fetchProducts]);


  const { minPossiblePrice, maxPossiblePrice } = useMemo(() => {
    // This could also be fetched from backend or calculated from a wider dataset if needed
    // For now, a sensible default or derived from currently loaded (small set) of products.
    if (products.length === 0 && !isLoading) return { minPossiblePrice: 0, maxPossiblePrice: 1000 };
    const prices = products.map(p => p.price).filter(p => typeof p === 'number');
    if (prices.length === 0) return { minPossiblePrice: 0, maxPossiblePrice: 1000 };
    return {
      minPossiblePrice: Math.floor(Math.min(...prices)),
      maxPossiblePrice: Math.ceil(Math.max(...prices)),
    };
  }, [products, isLoading]);


  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages && pageNumber !== currentPage) {
      setCurrentPage(pageNumber); // This will trigger the useEffect to fetchProducts
      const productListTop = document.getElementById('product-list-section');
      if (productListTop) {
        const headerOffset = document.querySelector('nav')?.offsetHeight || 80; // Adjust 'nav' selector
        const elementPosition = productListTop.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 20;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
      }
    }
  };
  
  const handleResetAllFilters = () => {
    setSelectedCategory("All");
    setSearchTerm(""); // This will update debouncedSearchTerm via its useEffect
    setPriceRange({ min: '', max: '' });
    setSortOption("default");
    setRatingFilter(0);
    setCurrentPage(1); // This will trigger fetchProducts
    navigate(location.pathname, { replace: true }); // Clear URL query params
  };
  
  const headerHeight = "4rem"; // Adjust this to your actual Navbar height

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">Our Products</h1>
          <p className="mt-3 text-lg text-gray-600">Browse our extensive collection of high-quality clothing.</p>
        </div>

        <div className="mb-8 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search by product name..."
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
            <ProductFilter
              categories={availableCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              sortOption={sortOption}
              setSortOption={setSortOption}
              minPossiblePrice={minPossiblePrice} // These might be less accurate now
              maxPossiblePrice={maxPossiblePrice} // if derived from paged product data
              ratingFilter={ratingFilter}
              setRatingFilter={setRatingFilter}
              onResetFilters={handleResetAllFilters}
            />
          </aside>

          <main className="w-full md:w-2/3 lg:w-3/4 xl:w-4/5">
            {isLoading && (
              <div className="flex justify-center items-center min-h-[300px]">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {!isLoading && error && (
              <div className="col-span-full text-center text-red-500 py-16 bg-white rounded-lg shadow-md p-6">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-3" />
                <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Products</h3>
                <p>{error}</p>
                <button onClick={() => fetchProducts(1)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Try Again</button>
              </div>
            )}
            {!isLoading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => ( // products are now directly from the current page fetch
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 mb-4 py-4 border-t border-gray-200" aria-label="Pagination">
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> 
                      <span className="hidden sm:inline"> ({totalElements} results)</span>
                    </p>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => paginate(1)} disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">First</button>
                      <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
                      
                      {/* Simplified Page Number Display */}
                       {[...Array(totalPages).keys()].map(num => {
                          const pageNum = num + 1;
                          if (
                            pageNum === 1 || pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) ||
                            (totalPages <= 5) 
                          ) {
                            return (
                              <button key={pageNum} onClick={() => paginate(pageNum)}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}>
                                {pageNum}
                              </button>
                            );
                          } if ( (pageNum === currentPage - 2 && currentPage > 3) || (pageNum === currentPage + 2 && currentPage < totalPages - 2) ) {
                            return <span key={pageNum} className="px-3 py-1.5 text-sm">...</span>;
                          }
                          return null;
                        })}

                      <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
                      <button onClick={() => paginate(totalPages)} disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Last</button>
                    </div>
                  </nav>
                )}
              </>
            )}
            {!isLoading && !error && products.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-16 bg-white rounded-lg shadow-md">
                <EmptyProductStateIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-700">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria, or check back later!</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
