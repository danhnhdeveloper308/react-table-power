import React, { useState, useMemo } from 'react';
import { z } from 'zod';
import { EnhancedFormDialogManager } from '../src/components/EnhancedFormDialogManager';
import { useFormContext, Controller } from 'react-hook-form';

// Product schema for our CRUD example
const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  category: z.enum(['electronics', 'clothing', 'books', 'home', 'sports'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  inStock: z.boolean().default(true),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  tags: z.array(z.string()).default([]),
  releaseDate: z.string().optional(),
  rating: z.number().min(0).max(5).optional()
});

type Product = z.infer<typeof productSchema>;

// Sample data
const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 199.99,
    category: 'electronics',
    inStock: true,
    sku: 'WH-001',
    tags: ['audio', 'wireless', 'premium'],
    releaseDate: '2023-01-15',
    rating: 4.5
  },
  {
    id: 2,
    name: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt in various colors',
    price: 29.99,
    category: 'clothing',
    inStock: true,
    sku: 'TS-002',
    tags: ['cotton', 'casual', 'unisex'],
    releaseDate: '2023-03-20',
    rating: 4.2
  },
  {
    id: 3,
    name: 'JavaScript Guide',
    description: 'Comprehensive guide to modern JavaScript development',
    price: 45.00,
    category: 'books',
    inStock: false,
    sku: 'BK-003',
    tags: ['programming', 'javascript', 'education'],
    releaseDate: '2023-02-10',
    rating: 4.8
  }
];

// Category options
const categoryOptions = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' }
];

// Tag suggestions
const tagSuggestions = [
  'premium', 'wireless', 'audio', 'cotton', 'casual', 'unisex', 
  'programming', 'javascript', 'education', 'outdoor', 'fitness'
];

// Create form component
function ProductCreateForm() {
  const { register, control, formState: { errors }, watch } = useFormContext<Product>();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="name" className="form-label required">Product Name</label>
          <input
            {...register('name')}
            id="name"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter product name"
          />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="sku" className="form-label required">SKU</label>
          <input
            {...register('sku')}
            id="sku"
            className={`form-input ${errors.sku ? 'error' : ''}`}
            placeholder="e.g., PRD-001"
          />
          {errors.sku && <p className="form-error">{errors.sku.message}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label required">Description</label>
        <textarea
          {...register('description')}
          id="description"
          className={`form-textarea ${errors.description ? 'error' : ''}`}
          placeholder="Describe the product..."
          rows={3}
        />
        {errors.description && <p className="form-error">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="price" className="form-label required">Price ($)</label>
          <input
            {...register('price', { valueAsNumber: true })}
            id="price"
            type="number"
            step="0.01"
            min="0"
            className={`form-input ${errors.price ? 'error' : ''}`}
            placeholder="0.00"
          />
          {errors.price && <p className="form-error">{errors.price.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label required">Category</label>
          <select
            {...register('category')}
            id="category"
            className={`form-select ${errors.category ? 'error' : ''}`}
          >
            <option value="">Select category</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="form-error">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="releaseDate" className="form-label">Release Date</label>
          <input
            {...register('releaseDate')}
            id="releaseDate"
            type="date"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rating" className="form-label">Rating (0-5)</label>
          <input
            {...register('rating', { valueAsNumber: true })}
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="form-input"
            placeholder="4.5"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            {...register('inStock')}
            id="inStock"
            type="checkbox"
            className="form-checkbox"
          />
          <label htmlFor="inStock" className="form-label">In Stock</label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Tags</label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagInput
              value={field.value || []}
              onChange={field.onChange}
              suggestions={tagSuggestions}
            />
          )}
        />
      </div>
    </div>
  );
}

// Edit form component (reuses create form)
function ProductEditForm() {
  return <ProductCreateForm />;
}

// View form component (read-only)
function ProductViewForm() {
  const { watch } = useFormContext<Product>();
  const product = watch();

  return (
    <div className="space-y-4">
      <div className="view-grid">
        <div className="view-item">
          <label className="view-label">Product Name</label>
          <p className="view-value">{product.name}</p>
        </div>

        <div className="view-item">
          <label className="view-label">SKU</label>
          <p className="view-value">{product.sku}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Description</label>
          <p className="view-value">{product.description}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Price</label>
          <p className="view-value">${product.price?.toFixed(2)}</p>
        </div>

        <div className="view-item">
          <label className="view-label">Category</label>
          <p className="view-value">
            {categoryOptions.find(c => c.value === product.category)?.label}
          </p>
        </div>

        <div className="view-item">
          <label className="view-label">Status</label>
          <p className="view-value">
            <span className={`status-badge ${product.inStock ? 'in-stock' : 'out-stock'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </p>
        </div>

        {product.releaseDate && (
          <div className="view-item">
            <label className="view-label">Release Date</label>
            <p className="view-value">
              {new Date(product.releaseDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {product.rating && (
          <div className="view-item">
            <label className="view-label">Rating</label>
            <p className="view-value">
              <span className="rating">
                {'★'.repeat(Math.floor(product.rating))}
                {'☆'.repeat(5 - Math.floor(product.rating))}
                {product.rating}
              </span>
            </p>
          </div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="view-item full-width">
            <label className="view-label">Tags</label>
            <div className="tag-list">
              {product.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Delete confirmation component
function ProductDeleteForm() {
  const { watch } = useFormContext<Product>();
  const product = watch();

  return (
    <div className="delete-confirmation">
      <div className="warning-icon">⚠️</div>
      <p className="warning-text">
        Are you sure you want to delete this product? This action cannot be undone.
      </p>
      <div className="product-summary">
        <h4>Product to be deleted:</h4>
        <dl>
          <dt>Name:</dt>
          <dd>{product.name}</dd>
          <dt>SKU:</dt>
          <dd>{product.sku}</dd>
          <dt>Price:</dt>
          <dd>${product.price?.toFixed(2)}</dd>
        </dl>
      </div>
    </div>
  );
}

// Simple tag input component
function TagInput({ 
  value = [], 
  onChange, 
  suggestions = [] 
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-container">
        {value.map((tag, index) => (
          <span key={index} className="tag editable">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="tag-remove"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="tag-input-field"
          placeholder="Add tags..."
        />
      </div>
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          {suggestions
            .filter(suggestion => !value.includes(suggestion))
            .map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="tag-suggestion"
              >
                {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// Product table component
function ProductTable({ 
  products, 
  onEdit, 
  onView, 
  onDelete 
}: {
  products: Product[];
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <div className="table-container">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                <div className="product-name">
                  {product.name}
                  {product.tags && product.tags.length > 0 && (
                    <div className="tags-preview">
                      {product.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="tag small">{tag}</span>
                      ))}
                      {product.tags.length > 2 && (
                        <span className="tag small">+{product.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td>{product.sku}</td>
              <td>
                {categoryOptions.find(c => c.value === product.category)?.label}
              </td>
              <td>${product.price.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${product.inStock ? 'in-stock' : 'out-stock'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
              <td>
                {product.rating ? (
                  <span className="rating">
                    {'★'.repeat(Math.floor(product.rating))} {product.rating}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onView(product)}
                    className="btn btn-sm btn-outline"
                    title="View details"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="btn btn-sm btn-primary"
                    title="Edit product"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="btn btn-sm btn-danger"
                    title="Delete product"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main CRUD example component
export function CRUDTableExample() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [nextId, setNextId] = useState(4);

  // Simulate API operations
  const handleSubmit = async (data: Product, mode: 'create' | 'edit' | 'delete') => {
    console.log(`${mode} operation:`, data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (mode) {
      case 'create':
        const newProduct = { ...data, id: nextId };
        setProducts(prev => [...prev, newProduct]);
        setNextId(prev => prev + 1);
        break;
        
      case 'edit':
        setProducts(prev => 
          prev.map(p => p.id === data.id ? data : p)
        );
        break;
        
      case 'delete':
        setProducts(prev => 
          prev.filter(p => p.id !== data.id)
        );
        break;
    }

    return true;
  };

  const schemas = useMemo(() => ({
    create: productSchema.omit({ id: true }),
    edit: productSchema,
    view: productSchema,
    delete: productSchema
  }), []);

  const formComponents = useMemo(() => ({
    create: ProductCreateForm,
    edit: ProductEditForm,
    view: ProductViewForm,
    delete: ProductDeleteForm
  }), []);

  const defaultValuesProviders = useMemo(() => ({
    create: () => ({
      inStock: true,
      tags: [],
      price: 0
    })
  }), []);

  return (
    <div className="crud-example">
      <div className="example-header">
        <h1>CRUD Table Example</h1>
        <p>
          Complete product management with create, read, update, and delete operations
          using the EnhancedFormDialogManager.
        </p>
      </div>

      <EnhancedFormDialogManager
        schemas={schemas}
        formComponents={formComponents}
        defaultValuesProviders={defaultValuesProviders}
        onSubmit={handleSubmit}
        dialogConfig={{
          width: '700px',
          closeOnClickOutside: true,
          closeOnEsc: true
        }}
      >
        {({ openCreateDialog, openEditDialog, openViewDialog, openDeleteDialog, dialogState }) => (
          <div className="table-section">
            <div className="table-header">
              <h2>Products ({products.length})</h2>
              <button
                onClick={() => openCreateDialog()}
                className="btn btn-primary"
              >
                + Add Product
              </button>
            </div>

            <ProductTable
              products={products}
              onEdit={openEditDialog}
              onView={openViewDialog}
              onDelete={openDeleteDialog}
            />

            {products.length === 0 && (
              <div className="empty-state">
                <p>No products found. Create your first product!</p>
                <button
                  onClick={() => openCreateDialog()}
                  className="btn btn-primary"
                >
                  Add Product
                </button>
              </div>
            )}
          </div>
        )}
      </EnhancedFormDialogManager>

      <style jsx>{`
        .crud-example {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .example-header {
          margin-bottom: 2rem;
        }

        .example-header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .example-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .table-section {
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .table-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .table-container {
          overflow-x: auto;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
        }

        .product-table th,
        .product-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .product-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .product-name {
          font-weight: 500;
        }

        .tags-preview {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.25rem;
          flex-wrap: wrap;
        }

        .tag {
          background: #e5e7eb;
          color: #374151;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tag.small {
          padding: 0.125rem 0.375rem;
          font-size: 0.625rem;
        }

        .tag.editable {
          background: #dbeafe;
          color: #1e40af;
          padding: 0.25rem 0.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .tag-remove {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          font-weight: bold;
          margin-left: 0.25rem;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-badge.in-stock {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.out-stock {
          background: #fee2e2;
          color: #991b1b;
        }

        .rating {
          color: #f59e0b;
          font-size: 0.875rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          font-size: 0.875rem;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-outline {
          border-color: #d1d5db;
          color: #374151;
          background-color: white;
        }

        .btn-outline:hover {
          background-color: #f9fafb;
        }

        .btn-danger {
          background-color: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background-color: #b91c1c;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: #374151;
        }

        .form-label.required::after {
          content: '*';
          color: #dc2626;
          margin-left: 0.25rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error,
        .form-select.error,
        .form-textarea.error {
          border-color: #dc2626;
        }

        .form-checkbox {
          margin-right: 0.5rem;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .form-error {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          margin-bottom: 0;
        }

        .grid {
          display: grid;
        }

        .grid-cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .gap-4 {
          gap: 1rem;
        }

        .space-y-4 > * + * {
          margin-top: 1rem;
        }

        .tag-input {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem;
        }

        .tag-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          align-items: center;
        }

        .tag-input-field {
          border: none;
          outline: none;
          flex: 1;
          min-width: 120px;
          padding: 0.25rem;
        }

        .tag-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .tag-suggestion {
          background: #f3f4f6;
          color: #374151;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .tag-suggestion:hover {
          background: #e5e7eb;
        }

        .view-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .view-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .view-item.full-width {
          grid-column: 1 / -1;
        }

        .view-label {
          display: block;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .view-value {
          margin: 0;
          color: #374151;
          font-weight: 500;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .delete-confirmation {
          text-align: center;
          padding: 1rem;
        }

        .warning-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .warning-text {
          margin-bottom: 1rem;
          color: #374151;
        }

        .product-summary {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        }

        .product-summary h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-weight: 600;
        }

        .product-summary dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.5rem;
          margin: 0;
        }

        .product-summary dt {
          font-weight: 500;
          color: #6b7280;
        }

        .product-summary dd {
          margin: 0;
          color: #374151;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-state p {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}

export default CRUDTableExample;
