import React from 'react';
import { AdjustmentsHorizontalIcon, ArrowsUpDownIcon, StarIcon as OutlineStarIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';

// This component provides UI for filtering and sorting products.
// It manages the state for selected filters and communicates these selections
// to a parent component (e.g., ProductsPage) via props (setSelectedCategory, setPriceRange, etc.).
// The parent component is then responsible for making the API call to the backend
// (e.g., GET /api/products) with the appropriate query parameters.

// Backend API (/api/products) expects query parameters like:
// - category (String)
// - minPrice (Float)
// - maxPrice (Float)
// - minRating (Float)
// - sortBy (String: "name", "price", "averageRating", "id")
// - sortDir (String: "ASC", "DESC")
// - searchTerm (String) - Note: searchTerm is typically handled by a separate search input, not this component.

export default function ProductFilter({
  categories,             // Array of available category strings (ideally fetched from backend)
  selectedCategory,       // Current selected category (maps to 'category' query param)
  setSelectedCategory,    // Setter for selectedCategory
  priceRange,             // Object { min, max } (maps to 'minPrice', 'maxPrice' query params)
  setPriceRange,          // Setter for priceRange
  sortOption,             // Current sort option string (e.g., 'price-asc')
  setSortOption,          // Setter for sortOption
  minPossiblePrice,       // For UI display (placeholder)
  maxPossiblePrice,       // For UI display (placeholder)
  ratingFilter,           // Current rating filter (maps to 'minRating' query param)
  setRatingFilter,        // Setter for ratingFilter
  onResetFilters,         // Function to reset all filters
}) {

  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    // Parent component will use priceRange.min for the 'minPrice' query param
    setPriceRange(prev => ({ ...prev, min: value === '' ? '' : parseInt(value, 10) }));
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    // Parent component will use priceRange.max for the 'maxPrice' query param
    setPriceRange(prev => ({ ...prev, max: value === '' ? '' : parseInt(value, 10) }));
  };

  // These sortOptions are structured to be easily parsed by the parent component
  // into 'sortBy' and 'sortDir' query parameters for the backend.
  const sortOptions = [
    { value: 'default', label: 'Default Sorting' }, // No sort params or backend default
    { value: 'price-asc', label: 'Price: Low to High' }, // sortBy=price, sortDir=ASC
    { value: 'price-desc', label: 'Price: High to Low' },// sortBy=price, sortDir=DESC
    { value: 'name-asc', label: 'Name: A to Z' },       // sortBy=name, sortDir=ASC
    { value: 'name-desc', label: 'Name: Z to A' },      // sortBy=name, sortDir=DESC
    { value: 'rating-desc', label: 'Rating: High to Low' },// sortBy=averageRating, sortDir=DESC
  ];

  // Rating filter options. The parent component will translate these into 'minRating'.
  // - 0 ('All Ratings'): minRating = 0 or not sent.
  // - 'NO_RATING': This is a frontend concept. Backend doesn't have a direct "no rating" filter.
  //                Parent might need custom logic if this needs to filter products with numOfReviews === 0.
  //                For now, it's up to the parent how to interpret this.
  // - 1-4: minRating = value (e.g., for "4 Stars & Up", minRating = 4).
  const ratingButtons = [
    { value: 0, label: 'All Ratings' },         // minRating = 0
    // { value: 'NO_RATING', label: 'No Rating Yet' }, // Requires special handling by parent
    { value: 4, label: '4 Stars & Up' },        // minRating = 4
    { value: 3, label: '3 Stars & Up' },        // minRating = 3
    { value: 2, label: '2 Stars & Up' },        // minRating = 2
    { value: 1, label: '1 Star & Up' },        // minRating = 1
  ];

  const renderRatingStars = (starsToFill) => {
    let starIcons = [];
    for (let i = 0; i < 5; i++) {
      if (i < starsToFill) {
        starIcons.push(<SolidStarIcon key={`solid-${i}`} className="h-4 w-4 text-yellow-400 inline-block" />);
      } else {
        starIcons.push(<OutlineStarIcon key={`outline-${i}`} className="h-4 w-4 text-gray-300 inline-block" />);
      }
    }
    return starIcons;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
        <button
          onClick={onResetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          title="Reset all filters"
        >
          <XCircleIcon className="h-5 w-5 mr-1" /> Reset All
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-500" />
          Category
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')} // 'All' means no 'category' query param or specific handling by parent
            className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)} // Sets the 'category' query param value
              className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Price Range</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <label htmlFor="minPrice" className="sr-only">Min Price</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</div>
            <input
              type="number" id="minPrice" placeholder={`Min (${minPossiblePrice || 0})`}
              value={priceRange.min} 
              onChange={handleMinPriceChange} min="0"
              className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <span className="text-gray-500 hidden sm:inline-block">–</span>
          <div className="relative w-full sm:w-auto flex-1">
            <label htmlFor="maxPrice" className="sr-only">Max Price</label>
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-500">$</div>
            <input
              type="number" id="maxPrice" placeholder={`Max (${maxPossiblePrice || 'Any'})`}
              value={priceRange.max} 
              onChange={handleMaxPriceChange} min="0"
              className="w-full pl-5 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <OutlineStarIcon className="h-5 w-5 mr-2 text-gray-500" />
          Rating
        </h3>
        <div className="flex flex-wrap gap-2">
          {ratingButtons.map(option => (
            <button
              key={option.value}
              onClick={() => setRatingFilter(option.value)} // Parent translates this to 'minRating'
              className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 flex items-center gap-1 ${
                ratingFilter === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {typeof option.value === 'number' && option.value > 0 && renderRatingStars(option.value)}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <ArrowsUpDownIcon className="h-5 w-5 mr-2 text-gray-500" />
          Sort By
        </h3>
        <select
          value={sortOption} // Parent parses this into 'sortBy' and 'sortDir'
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
