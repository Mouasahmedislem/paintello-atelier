import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Card, 
  Row, 
  Col, 
  Badge,
  Spinner,
  Alert,
  Dropdown
} from 'react-bootstrap';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaQrcode, 
  FaFilter,
  FaDownload,
  FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode.react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: 'statue',
    status: 'pending',
    quantity: 1,
    dimensions: { height: 0, width: 0, depth: 0 },
    weight: 0,
    location: '',
    notes: ''
  });

  // Status options and colors
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'molding', label: 'Molding', color: 'info' },
    { value: 'demolded', label: 'Demolded', color: 'secondary' },
    { value: 'ready_to_paint', label: 'Ready to Paint', color: 'primary' },
    { value: 'painting', label: 'Painting', color: 'info' },
    { value: 'finished', label: 'Finished', color: 'success' },
    { value: 'shipped', label: 'Shipped', color: 'dark' }
  ];

  const categoryOptions = [
    'statue', 'relief', 'ornament', 'custom', 'other'
  ];

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data.data || []);
    } catch (err) {
      setError('Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/products/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('dimensions.')) {
      const dimensionField = name.split('.')[1];
      setFormData({
        ...formData,
        dimensions: {
          ...formData.dimensions,
          [dimensionField]: parseFloat(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'quantity' || name === 'weight' ? parseFloat(value) || 0 : value
      });
    }
  };

  // Handle form submission (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        // Update existing product
        await axios.put(`/api/products/${selectedProduct._id}`, formData);
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await axios.post('/api/products', formData);
        toast.success('Product created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  // Delete a product
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        toast.success('Product deleted successfully');
        fetchProducts();
        fetchStats();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  // Update product status
  const handleStatusChange = async (productId, newStatus) => {
    try {
      await axios.patch(`/api/products/${productId}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Open modal for editing
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode || '',
      name: product.name || '',
      category: product.category || 'statue',
      status: product.status || 'pending',
      quantity: product.quantity || 1,
      dimensions: {
        height: product.dimensions?.height || 0,
        width: product.dimensions?.width || 0,
        depth: product.dimensions?.depth || 0
      },
      weight: product.weight || 0,
      location: product.location || '',
      notes: product.notes || ''
    });
    setShowModal(true);
  };

  // Open modal for creating new
  const handleCreate = () => {
    setSelectedProduct(null);
    resetForm();
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      productCode: `PROD-${Date.now().toString().slice(-6)}`,
      name: '',
      category: 'statue',
      status: 'pending',
      quantity: 1,
      dimensions: { height: 0, width: 0, depth: 0 },
      weight: 0,
      location: '',
      notes: ''
    });
  };

  // Show QR code
  const showQRCode = (product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return (
      <Badge bg={statusObj?.color || 'secondary'}>
        {statusObj?.label || status}
      </Badge>
    );
  };

  // Calculate total volume
  const calculateVolume = (dimensions) => {
    if (!dimensions) return 0;
    return (dimensions.height * dimensions.width * dimensions.depth / 1000).toFixed(2);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Products Management</h2>
          <p className="text-muted">Manage and track all production products</p>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleCreate}>
            <FaPlus className="me-2" /> Add New Product
          </Button>
        </Col>
      </Row>

      {/* Stats Card */}
      {stats && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <h5 className="card-title">Product Overview</h5>
                <Row>
                  <Col md={3}>
                    <div className="text-center p-3">
                      <h3 className="text-primary">{stats.totalProducts || 0}</h3>
                      <p className="text-muted mb-0">Total Products</p>
                    </div>
                  </Col>
                  {stats.byStatus?.map((item, index) => (
                    <Col md={2} key={index}>
                      <div className="text-center p-3">
                        <h3>{item.count}</h3>
                        <p className="text-muted mb-0">{item.status}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by code, name, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Col>
        <Col md={3}>
          <Form.Select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status, index) => (
              <option key={index} value={status.value}>
                {status.label}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3} className="text-end">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">
              <FaFilter className="me-2" /> Actions
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>
                <FaDownload className="me-2" /> Export Data
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Products Table */}
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Dimensions (cm)</th>
                  <th>Weight (kg)</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No products found. {searchTerm && 'Try a different search.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.productCode}</strong>
                        <div className="small text-muted">
                          Created: {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>{product.name}</td>
                      <td>
                        <Badge bg="light" text="dark">
                          {product.category}
                        </Badge>
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle variant="link" className="p-0">
                            {getStatusBadge(product.status)}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {statusOptions.map((status, index) => (
                              <Dropdown.Item 
                                key={index}
                                onClick={() => handleStatusChange(product._id, status.value)}
                              >
                                {status.label}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                      <td>{product.quantity}</td>
                      <td>
                        {product.dimensions ? (
                          <>
                            H: {product.dimensions.height} × 
                            W: {product.dimensions.width} × 
                            D: {product.dimensions.depth}
                            <div className="small text-muted">
                              Vol: {calculateVolume(product.dimensions)} L
                            </div>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td>{product.weight} kg</td>
                      <td>{product.location || 'Not set'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(product)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => showQRCode(product)}
                        >
                          <FaQrcode />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Product Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedProduct ? 'Edit Product' : 'Create New Product'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleChange}
                    required
                    disabled={!!selectedProduct}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {categoryOptions.map((category, index) => (
                      <option key={index} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Shelf A3, Rack B2"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-4 mb-3">Dimensions (cm)</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Width</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Depth</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="dimensions.depth"
                    value={formData.dimensions.depth}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes or instructions..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {selectedProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* QR Code Modal */}
      <Modal show={showQRModal} onHide={() => setShowQRModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Product QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedProduct && (
            <>
              <QRCode 
                value={JSON.stringify({
                  id: selectedProduct._id,
                  code: selectedProduct.productCode,
                  name: selectedProduct.name
                })}
                size={200}
              />
              <div className="mt-3">
                <h5>{selectedProduct.productCode}</h5>
                <p className="text-muted">{selectedProduct.name}</p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQRModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Products;
