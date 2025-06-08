import React from 'react';
import { AdjustmentsHorizontalIcon, StarIcon as OutlineStarIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid';

/**
 * A reusable component for displaying product filtering and sorting options.
 * This component is controlled by its parent, which manages the state.
 */
export default function ProductFilter({
  categories,
  filters,
  setFilters,
  priceRangeMeta,
  onResetFilters,
}) {

  // This function handles changes for the text inputs and the select dropdown.
  // It is correctly assigned to them below.
  const handleChange = (e) => {
    setFilters({ [e.target.name]: e.target.value });
  };
  
  const handleCategoryChange = (category) => {
    setFilters({ category });
  };

  const handleRatingChange = (rating) => {
    const newRating = filters.rating === rating ? 0 : rating;
    setFilters({ rating: newRating });
  };
  
  const renderRatingStars = (starsToFill) => (
    [...Array(5)].map((_, i) => (
        i < starsToFill 
        ? <SolidStarIcon key={`solid-${i}`} className="h-4 w-4" />
        : <OutlineStarIcon key={`outline-${i}`} className="h-4 w-4" />
    ))
  );

  const sortOptions = [
    { value: 'name-asc', label: 'Alphabetical: A-Z' },
    { value: 'name-desc', label: 'Alphabetical: Z-A' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating-desc', label: 'Rating: High to Low' },
  ];
  
  const ratingButtons = [
    { value: 4, label: '4+' },
    { value: 3, label: '3+' },
    { value: 2, label: '2+' },
    { value: 1, label: '1+' },
    { value: -1, label: 'No Ratings Yet' },
  ];

  const baseButtonClass = "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5";
  const activeButtonClass = "bg-blue-600 text-white";
  const inactiveButtonClass = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2"><AdjustmentsHorizontalIcon className="h-6 w-6"/>Filters</h2>
        <button onClick={onResetFilters} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><XCircleIcon className="h-4 w-4" /> Reset</button>
      </div>
      
      {/* Category Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleCategoryChange('All')} className={`${baseButtonClass} ${filters.category === 'All' ? activeButtonClass : inactiveButtonClass}`}>All</button>
          {categories.filter(c => c !== 'All').map((cat) => (
            <button key={cat} onClick={() => handleCategoryChange(cat)} className={`${baseButtonClass} ${filters.category === cat ? activeButtonClass : inactiveButtonClass}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Price Range Filter - Both inputs have `value` and `onChange` */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <input type="number" name="minPrice" placeholder={`Min ($${priceRangeMeta.min})`} value={filters.minPrice} onChange={handleChange} min="0" className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-md sm:text-sm" />
          <span className="text-gray-500">–</span>
          <input type="number" name="maxPrice" placeholder={`Max ($${priceRangeMeta.max})`} value={filters.maxPrice} onChange={handleChange} min="0" className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-md sm:text-sm" />
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Rating</h3>
        <div className="flex flex-wrap gap-2">
           <button onClick={() => handleRatingChange(0)} className={`${baseButtonClass} ${filters.rating === 0 ? activeButtonClass : inactiveButtonClass}`}>
              All Ratings
            </button>
          {ratingButtons.map(({ value, label }) => (
            <button key={value} onClick={() => handleRatingChange(value)} className={`${baseButtonClass} ${filters.rating === value ? activeButtonClass : inactiveButtonClass}`}>
              {value > 0 && renderRatingStars(value)}
              <span className={value > 0 ? 'text-xs' : ''}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort By Dropdown - This select has `value` and `onChange` */}
      <div className="pt-2 border-t">
        <label htmlFor="sort" className="block text-lg font-semibold text-gray-700 mb-3">Sort By</label>
        <select id="sort" name="sort" value={filters.sort} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm">
          {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>
    </div>
  );
}