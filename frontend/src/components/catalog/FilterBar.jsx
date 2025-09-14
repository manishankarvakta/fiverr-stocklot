import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { X, Search, Filter } from 'lucide-react';

const FilterBar = ({ state, setFilters, facets, type = 'listings' }) => {
  const [searchInput, setSearchInput] = useState(state.q || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ q: searchInput });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const clearFilter = (key) => {
    setFilters({ [key]: '' });
  };

  const clearAllFilters = () => {
    setFilters({
      species: '',
      category: '',
      breed: '',
      province: '',
      q: '',
      min_qty: '',
      max_qty: '',
      min_price: '',
      max_price: '',
    });
    setSearchInput('');
  };

  const activeFilters = Object.entries(state).filter(([key, value]) => value && value !== '');

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={`Search ${type}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="default">
          Search
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </form>

      {/* Filter Controls */}
      {(showAdvanced || activeFilters.length > 0) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Species Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species
              </label>
              <select
                value={state.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all-default">All species</option>
                {facets?.species?.map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={state.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all-default">All categories</option>
                {facets?.categories?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Breed Filter (dependent on species) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
              <select
                value={state.breed}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
                disabled={!state.species}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="all-default">All breeds</option>
                {facets?.breeds?.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <select
                value={state.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all-default">All provinces</option>
                {facets?.provinces?.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity and Price Filters (for buy requests) */}
          {type === 'requests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Quantity
                </label>
                <Input
                  type="number"
                  placeholder="Min qty"
                  value={state.min_qty}
                  onChange={(e) => handleFilterChange('min_qty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Quantity
                </label>
                <Input
                  type="number"
                  placeholder="Max qty"
                  value={state.max_qty}
                  onChange={(e) => handleFilterChange('max_qty', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Budget (R)
                </label>
                <Input
                  type="number"
                  placeholder="Min price"
                  value={state.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Budget (R)
                </label>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={state.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {activeFilters.map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="capitalize">{key.replace('_', ' ')}: {value}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => clearFilter(key)}
                />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;