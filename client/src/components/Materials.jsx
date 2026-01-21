import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Table, Button, Card, Form, Modal, Badge, Alert,
    Row, Col, InputGroup, FormControl, ProgressBar
} from 'react-bootstrap';
import { 
    FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaSearch,
    FaBox, FaTachometerAlt, FaWarehouse, FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [restockData, setRestockData] = useState({ quantity: 0, unitCost: 0, supplier: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    
    const [formData, setFormData] = useState({
        materialCode: '',
        name: '',
        type: 'cement',
        currentStock: 0,
        unit: 'kg',
        minThreshold: 10,
        unitCost: 0,
        supplier: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    useEffect(() => {
        filterMaterials();
    }, [materials, searchTerm, typeFilter]);

    const fetchMaterials = async () => {
        try {
            const response = await axios.get('/api/materials');
            setMaterials(response.data.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    };

    const filterMaterials = () => {
        let filtered = [...materials];
        
        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(material => 
                material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(material => material.type === typeFilter);
        }
        
        setFilteredMaterials(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedMaterial) {
                await axios.put(`/api/materials/${selectedMaterial._id}`, formData);
                toast.success('Material updated successfully');
            } else {
                await axios.post('/api/materials', formData);
                toast.success('Material created successfully');
            }
            setShowModal(false);
            setSelectedMaterial(null);
            resetForm();
            fetchMaterials();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error saving material');
        }
    };

    const handleRestock = async () => {
        try {
            await axios.post(`/api/materials/${selectedMaterial._id}/restock`, restockData);
            toast.success('Material restocked successfully');
            setShowRestockModal(false);
            setSelectedMaterial(null);
            setRestockData({ quantity: 0, unitCost: 0, supplier: '' });
            fetchMaterials();
        } catch (error) {
            toast.error('Error restocking material');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await axios.delete(`/api/materials/${id}`);
                toast.success('Material deleted successfully');
                fetchMaterials();
            } catch (error) {
                toast.error('Error deleting material');
            }
        }
    };

    const handleEdit = (material) => {
        setSelectedMaterial(material);
        setFormData({
            materialCode: material.materialCode,
            name: material.name,
            type: material.type,
            currentStock: material.currentStock,
            unit: material.unit,
            minThreshold: material.minThreshold,
            unitCost: material.unitCost || 0,
            supplier: material.supplier || '',
            location: material.location || '',
            notes: material.notes || ''
        });
        setShowModal(true);
    };

    const handleOpenRestock = (material) => {
        setSelectedMaterial(material);
        setRestockData({
            quantity: 0,
            unitCost: material.unitCost || 0,
            supplier: material.supplier || ''
        });
        setShowRestockModal(true);
    };

    const resetForm = () => {
        setFormData({
            materialCode: '',
            name: '',
            type: 'cement',
            currentStock: 0,
            unit: 'kg',
            minThreshold: 10,
            unitCost: 0,
            supplier: '',
            location: '',
            notes: ''
        });
    };

    const getTypeBadge = (type) => {
        const variants = {
            cement: 'primary',
            gypsum: 'secondary',
            additive: 'warning',
            color: 'info',
            primer: 'success',
            finish: 'dark',
            tool: 'danger',
            other: 'light'
        };
        return variants[type] || 'light';
    };

    const getStockPercentage = (current, min) => {
        if (current === 0) return 0;
        return Math.min((current / min) * 100, 100);
    };

    const getStockVariant = (current, min) => {
        if (current === 0) return 'danger';
        if (current < min) return 'warning';
        if (current < min * 2) return 'info';
        return 'success';
    };

    const lowStockMaterials = materials.filter(m => m.currentStock < m.minThreshold);
    const outOfStockMaterials = materials.filter(m => m.currentStock === 0);

    // Calculate total inventory value
    const totalInventoryValue = materials.reduce((sum, material) => {
        return sum + (material.currentStock * (material.unitCost || 0));
    }, 0);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="materials-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📦 Material Stock Management</h2>
                <Button variant="primary" onClick={() => {
                    setSelectedMaterial(null);
                    resetForm();
                    setShowModal(true);
                }}>
                    <FaPlus /> Add Material
                </Button>
            </div>

            {/* Alerts */}
            {outOfStockMaterials.length > 0 && (
                <Alert variant="danger" className="mb-4">
                    <FaExclamationTriangle className="me-2" />
                    <strong>Out of Stock:</strong> {outOfStockMaterials.length} materials are completely out of stock!
                </Alert>
            )}
            
            {lowStockMaterials.length > 0 && (
                <Alert variant="warning" className="mb-4">
                    <FaExclamationTriangle className="me-2" />
                    <strong>Low Stock Alert:</strong> {lowStockMaterials.length} materials are below minimum threshold.
                </Alert>
            )}

            {/* Summary Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaBox className="display-6 text-primary mb-3" />
                            <h5>Total Materials</h5>
                            <h2>{materials.length}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaTachometerAlt className="display-6 text-warning mb-3" />
                            <h5>Low Stock</h5>
                            <h2 className="text-warning">{lowStockMaterials.length}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaExclamationTriangle className="display-6 text-danger mb-3" />
                            <h5>Out of Stock</h5>
                            <h2 className="text-danger">{outOfStockMaterials.length}</h2>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaWarehouse className="display-6 text-success mb-3" />
                            <h5>Inventory Value</h5>
                            <h2 className="text-success">
                                ${totalInventoryValue.toFixed(2)}
                            </h2>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={5}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <FormControl
                                    placeholder="Search materials by name, code, or supplier..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="all">All Types</option>
                                <option value="cement">Cement</option>
                                <option value="gypsum">Gypsum</option>
                                <option value="additive">Additive</option>
                                <option value="color">Color</option>
                                <option value="primer">Primer</option>
                                <option value="finish">Finish</option>
                                <option value="tool">Tools</option>
                                <option value="other">Other</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-secondary" onClick={fetchMaterials} className="w-100">
                                <FaSync /> Refresh
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Materials Table */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        Material Inventory ({filteredMaterials.length} items)
                    </h5>
                    <div className="text-muted small">
                        Showing {filteredMaterials.length} of {materials.length} materials
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="table-responsive">
                        <Table hover striped>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Material Name</th>
                                    <th>Type</th>
                                    <th>Current Stock</th>
                                    <th>Stock Status</th>
                                    <th>Min Threshold</th>
                                    <th>Unit Cost</th>
                                    <th>Supplier</th>
                                    <th>Location</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaterials.map(material => {
                                    const stockPercentage = getStockPercentage(material.currentStock, material.minThreshold);
                                    const stockVariant = getStockVariant(material.currentStock, material.minThreshold);
                                    
                                    return (
                                        <tr key={material._id} className={material.currentStock < material.minThreshold ? 'table-warning' : ''}>
                                            <td>
                                                <strong>{material.materialCode}</strong>
                                            </td>
                                            <td>
                                                <div>{material.name}</div>
                                                {material.notes && (
                                                    <small className="text-muted d-block">{material.notes.substring(0, 40)}...</small>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={getTypeBadge(material.type)}>
                                                    {material.type}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="me-3" style={{ width: '100px' }}>
                                                        <ProgressBar 
                                                            now={stockPercentage} 
                                                            variant={stockVariant}
                                                            label={`${material.currentStock}${material.unit}`}
                                                        />
                                                    </div>
                                                    <strong>{material.currentStock}{material.unit}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                {material.currentStock === 0 ? (
                                                    <Badge bg="danger">Out of Stock</Badge>
                                                ) : material.currentStock < material.minThreshold ? (
                                                    <Badge bg="warning">Low Stock</Badge>
                                                ) : material.currentStock < material.minThreshold * 2 ? (
                                                    <Badge bg="info">Adequate</Badge>
                                                ) : (
                                                    <Badge bg="success">Good Stock</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {material.minThreshold}{material.unit}
                                            </td>
                                            <td>
                                                {material.unitCost ? `$${material.unitCost.toFixed(2)}` : '—'}
                                            </td>
                                            <td>
                                                {material.supplier || '—'}
                                            </td>
                                            <td>
                                                {material.location || '—'}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button 
                                                        variant="outline-primary" 
                                                        size="sm"
                                                        onClick={() => handleEdit(material)}
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button 
                                                        variant="outline-success" 
                                                        size="sm"
                                                        onClick={() => handleOpenRestock(material)}
                                                    >
                                                        Restock
                                                    </Button>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleDelete(material._id)}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Low Stock Materials List */}
            {lowStockMaterials.length > 0 && (
                <Card className="mt-4">
                    <Card.Header className="bg-warning text-white">
                        <h5 className="mb-0">
                            <FaExclamationTriangle className="me-2" />
                            Low Stock Materials - Action Required
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            {lowStockMaterials.map(material => (
                                <Col md={6} lg={4} key={material._id} className="mb-3">
                                    <Card className="border-warning">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="mb-1">{material.name}</h6>
                                                    <small className="text-muted">{material.materialCode}</small>
                                                </div>
                                                <Badge bg="warning">Low Stock</Badge>
                                            </div>
                                            <div className="mb-2">
                                                <div className="d-flex justify-content-between small">
                                                    <span>Current:</span>
                                                    <strong>{material.currentStock}{material.unit}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between small">
                                                    <span>Minimum:</span>
                                                    <strong>{material.minThreshold}{material.unit}</strong>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="warning" 
                                                size="sm" 
                                                className="w-100"
                                                onClick={() => handleOpenRestock(material)}
                                            >
                                                Restock Now
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Add/Edit Material Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setSelectedMaterial(null); }} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedMaterial ? 'Edit Material' : 'Add New Material'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Material Code *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.materialCode}
                                        onChange={(e) => setFormData({...formData, materialCode: e.target.value.toUpperCase()})}
                                        required
                                        placeholder="e.g., CEMENT-WHITE"
                                    />
                                    <Form.Text className="text-muted">
                                        Unique code for identifying this material
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Material Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                        placeholder="e.g., Premium White Cement"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Material Type *</Form.Label>
                                    <Form.Select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        required
                                    >
                                        <option value="cement">Cement</option>
                                        <option value="gypsum">Gypsum</option>
                                        <option value="additive">Additive</option>
                                        <option value="color">Color/Pigment</option>
                                        <option value="primer">Primer</option>
                                        <option value="finish">Finish/Varnish</option>
                                        <option value="tool">Tool/Equipment</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Unit *</Form.Label>
                                    <Form.Select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                        required
                                    >
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="L">Liters (L)</option>
                                        <option value="bag">Bag</option>
                                        <option value="tube">Tube</option>
                                        <option value="bottle">Bottle</option>
                                        <option value="piece">Piece</option>
                                        <option value="roll">Roll</option>
                                        <option value="m²">Square Meter (m²)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Stock *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={formData.currentStock}
                                        onChange={(e) => setFormData({...formData, currentStock: parseFloat(e.target.value)})}
                                        required
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Threshold *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={formData.minThreshold}
                                        onChange={(e) => setFormData({...formData, minThreshold: parseFloat(e.target.value)})}
                                        required
                                        min="0"
                                    />
                                    <Form.Text className="text-muted">
                                        Alert when stock falls below this level
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Unit Cost ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={formData.unitCost}
                                        onChange={(e) => setFormData({...formData, unitCost: parseFloat(e.target.value)})}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Supplier</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                                        placeholder="Supplier company name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        placeholder="Storage location"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                placeholder="Any notes about this material..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedMaterial(null); }}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {selectedMaterial ? 'Update Material' : 'Add Material'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Restock Modal */}
            <Modal show={showRestockModal} onHide={() => { setShowRestockModal(false); setSelectedMaterial(null); }}>
                <Modal.Header closeButton>
                    <Modal.Title>Restock Material</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMaterial && (
                        <>
                            <Alert variant="info" className="mb-3">
                                <strong>Material:</strong> {selectedMaterial.name}<br />
                                <strong>Current Stock:</strong> {selectedMaterial.currentStock}{selectedMaterial.unit}<br />
                                <strong>Minimum Threshold:</strong> {selectedMaterial.minThreshold}{selectedMaterial.unit}
                            </Alert>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Restock Quantity *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={restockData.quantity}
                                    onChange={(e) => setRestockData({...restockData, quantity: parseFloat(e.target.value)})}
                                    required
                                    min="0.01"
                                />
                                <Form.Text className="text-muted">
                                    Enter quantity in {selectedMaterial.unit}
                                </Form.Text>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Unit Cost ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={restockData.unitCost}
                                    onChange={(e) => setRestockData({...restockData, unitCost: parseFloat(e.target.value)})}
                                    min="0"
                                />
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Supplier</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={restockData.supplier}
                                    onChange={(e) => setRestockData({...restockData, supplier: e.target.value})}
                                    placeholder="Supplier (optional)"
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowRestockModal(false); setSelectedMaterial(null); }}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleRestock}>
                        Confirm Restock
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Materials;
