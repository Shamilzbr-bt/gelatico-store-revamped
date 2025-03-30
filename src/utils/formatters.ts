/**
 * Format price in KWD
 */
export const formatPrice = (price: string | number) => {
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numericPrice.toFixed(3)} KWD`;
};

/**
 * Get CSS class for flavor tag
 */
export const getTagClass = (tag: string) => {
  const tagLower = tag.toLowerCase();
  if (tagLower === 'vegan') return 'flavor-tag-vegan';
  if (tagLower === 'dairy-free') return 'flavor-tag-dairy-free';
  if (tagLower === 'sugar-free') return 'flavor-tag-sugar-free';
  if (tagLower === 'classic') return 'flavor-tag-classic';
  if (tagLower === 'seasonal') return 'flavor-tag-seasonal';
  return 'bg-gray-100 text-gray-800';
};

/**
 * Format a date string into a readable format
 * @param dateString ISO date string
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | null | undefined, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
