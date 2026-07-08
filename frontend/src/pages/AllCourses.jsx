import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaFilter, FaTimes, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import Nav from '../components/Nav';
import aiIcon from '../assets/SearchAi.png';
import getCouseData from '../customHooks/getPublishedCourse';

const AllCourses = () => {
  // getCouseData();
  const navigate = useNavigate();
  const { courseData } = useSelector(state => state.course);


  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [category, setCategory] = useState([]);
  const [difficulty, setDifficulty] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Available filter options
  const categories = [
    "App Development", "AI/ML", "AI Tools", "Data Science",
    "Data Analytics", "Ethical Hacking", "UI UX Designing",
    "Web Development", "Others"
  ];
  const difficulties = ["Beginner", "Intermediate", "Advanced"];
  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "price", label: "Price" },
    { value: "rating", label: "Rating" },
    { value: "title", label: "Title" }
  ];

  // Filtering logic from the working component
  const applyFilter = () => {
    let copy = [...(courseData || [])];

    if (category.length > 0) copy = copy.filter(c => category.includes(c.category));
    if (difficulty.length > 0) copy = copy.filter(c => difficulty.includes(c.level));
    copy = copy.filter(c => c.price >= priceRange[0] && c.price <= priceRange[1]);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      copy = copy.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price") {
      copy.sort((a, b) => sortOrder === "asc" ? a.price - b.price : b.price - a.price);
    } else if (sortBy === "rating") {
      const avg = c => c.reviews?.length ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length : 0;
      copy.sort((a, b) => sortOrder === "asc" ? avg(a) - avg(b) : avg(b) - avg(a));
    } else if (sortBy === "title") {
      copy.sort((a, b) => sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    }

    setFilteredCourses(copy);
  };

  // Reset all filters
  const resetFilters = () => {
    setCategory([]);
    setDifficulty([]);
    setPriceRange([0, 10000]);
    setSearchQuery("");
    setSortBy("default");
    setSortOrder("asc");
  };

  // Active filter count
  const getActiveFilterCount = () => category.length + difficulty.length + (searchQuery ? 1 : 0) + (priceRange[1] < 10000 ? 1 : 0);

  // Initialize and apply filters when dependencies change
  useEffect(() => {
    setFilteredCourses(courseData || []);
    // console.log(courseData);

  }, [courseData]);

  useEffect(() => {
    applyFilter();
  }, [category, difficulty, priceRange, searchQuery, sortBy, sortOrder]);

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="pt-8 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
          <p className="mt-2 text-gray-600">
            Browse our comprehensive catalog of learning materials
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 pb-12">
          {/* Mobile Filter Dialog */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-40 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
                  onClick={() => setMobileFiltersOpen(false)}
                ></div>

                {/* Dialog content */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xs sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setMobileFiltersOpen(false)}
                      >
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Mobile Filter Content */}
                    <div className="space-y-6">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Categories */}
                      <div>
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            Categories
                          </label>
                          {category.length > 0 && (
                            <button
                              onClick={() => setCategory([])}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="mt-2 space-y-2">
                          {categories.map((cat) => (
                            <label key={cat} className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={category.includes(cat)}
                                onChange={() => setCategory(prev =>
                                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                )}
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                {cat}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            Difficulty
                          </label>
                          {difficulty.length > 0 && (
                            <button
                              onClick={() => setDifficulty([])}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {difficulties.map((level) => (
                            <button
                              key={level}
                              type="button"
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                difficulty.includes(level)
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                              onClick={() => setDifficulty(prev =>
                                prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
                              )}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range: Up to ₹{priceRange[1].toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>₹0</span>
                          <span>₹10,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      Apply Filters
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={resetFilters}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Categories
                  </label>
                  {category.length > 0 && (
                    <button
                      onClick={() => setCategory([])}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={category.includes(cat)}
                        onChange={() => setCategory(prev =>
                          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                        )}
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Difficulty
                  </label>
                  {difficulty.length > 0 && (
                    <button
                      onClick={() => setDifficulty([])}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {difficulties.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        difficulty.includes(level)
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => setDifficulty(prev =>
                        prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: Up to ₹{priceRange[1].toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹0</span>
                  <span>₹10,000</span>
                </div>
              </div>

              {/* AI Search Button */}
              <button
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-md text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition"
                onClick={() => navigate("/search")}
              >
                <img src={aiIcon} className='w-5 h-5' alt="AI Icon" />
                Search with AI
              </button>
            </div>
          </aside>

          {/* Course Grid */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
                </h2>
                {(
                  searchQuery ||
                  category.length > 0 ||
                  difficulty.length > 0 ||
                  priceRange[1] < 10000
                ) && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-1"
                  >
                    Reset all filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Sort Options */}
                <div className="flex items-center gap-2 bg-white border px-3 py-2 rounded-lg">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-transparent outline-none"
                  >
                    {sortOptions.map(o => (
                      <option key={o.value} value={o.value}>
                        Sort by {o.label}
                      </option>
                    ))}
                  </select>
                  {sortBy !== "default" && (
                    <button onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
                      {sortOrder === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="md:hidden inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <FaFilter className="mr-2 h-4 w-4" />
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Course Cards */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      thumbnail={course.thumbnail}
                      title={course.title}
                      price={course.price}
                      category={course.category}
                      id={course._id}
                      reviews={course.reviews}
                      level={course.level}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg
                    className="h-full w-full"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No courses found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                  onClick={resetFilters}
                >
                  Reset all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllCourses;