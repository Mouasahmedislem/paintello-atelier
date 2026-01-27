import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Card, Form, Button, Table, Badge, Row, Col,
    Alert, Tabs, Tab
} from 'react-bootstrap';
import { 
    FaSave, FaPlus, FaMinus, FaCalendar, FaClock,
    FaTools, FaBox, FaChartLine, FaHistory
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import moment from 'moment';

const Production = () => {
    const [formData, setFormData] = useState({
        shift: 'morning',
        products: [{ productCode: '', action: '', quantity: 1, timeSpent: 0 }],
        materialsUsed: [{ materialCode: '', quantity: 1, productCode: '' }],
        notes: '',
        workstation: 'Station 1'
    });
    
    const [products, setProducts] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('log');
    const [dailyStats, setDailyStats] = useState(null);

    useEffect(() => {
        fetchProducts();
        fetchMaterials();
        fetchProductionLogs();
        fetchDailyStats();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/products');
            setProducts(response.data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await axios.get('/api/materials');
            setMaterials(response.data.data || []);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const fetchProductionLogs = async () => {
        try {
            const response = await axios.get('/api/production?limit=10');
            setLogs(response.data.data || []);
        } catch (error) {
            console.error('Error fetching production logs:', error);
        }
    };

    const fetchDailyStats = async () => {
        try {
            const response = await axios.get('/api/production/daily');
            setDailyStats(response.data);
        } catch (error) {
            console.error('Error fetching daily stats:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            await axios.post('/api/production', formData);
            toast.success('Production log saved successfully!');
            
            // Reset form
            setFormData({
                shift: 'morning',
                products: [{ productCode: '', action: '', quantity: 1, timeSpent: 0 }],
                materialsUsed: [{ materialCode: '', quantity: 1, productCode: '' }],
                notes: '',
                workstation: 'Station 1'
            });
            
            // Refresh data
            fetchProductionLogs();
            fetchDailyStats();
            fetchProducts();
            fetchMaterials();
            
        } catch (error) {
            console.error('Submit error:', error.response?.data);
            toast.error(error.response?.data?.error || 'Error saving log');
        } finally {
            setLoading(false);
        }
    };

    const addProductField = () => {
        setFormData({
            ...formData,
            products: [...formData.products, { productCode: '', action: '', quantity: 1, timeSpent: 0 }]
        });
    };

    const removeProductField = (index) => {
        const newProducts = [...formData.products];
        if (newProducts.length > 1) {
            newProducts.splice(index, 1);
            setFormData({ ...formData, products: newProducts });
        }
    };

    const addMaterialField = () => {
        setFormData({
            ...formData,
            materialsUsed: [...formData.materialsUsed, { materialCode: '', quantity: 1, productCode: '' }]
        });
    };

    const removeMaterialField = (index) => {
        const newMaterials = [...formData.materialsUsed];
        if (newMaterials.length > 1) {
            newMaterials.splice(index, 1);
            setFormData({ ...formData, materialsUsed: newMaterials });
        }
    };

    const updateProductField = (index, field, value) => {
        const newProducts = [...formData.products];
        newProducts[index][field] = value;
        setFormData({ ...formData, products: newProducts });
    };

    const updateMaterialField = (index, field, value) => {
        const newMaterials = [...formData.materialsUsed];
        newMaterials[index][field] = value;
        setFormData({ ...formData, materialsUsed: newMaterials });
    };

    const getActionOptions = () => {
        return [
            { value: 'started', label: 'Started Production' },
            { value: 'demolded', label: 'Demolded' },
            { value: 'dried', label: 'Dried' },
            { value: 'primed', label: 'Primed' },
            { value: 'painted', label: 'Painted' },
            { value: 'finished', label: 'Finished' },
            { value: 'packaged', label: 'Packaged' },
            { value: 'quality_check', label: 'Quality Check' }
        ];
    };

    const getActionColor = (action) => {
        const colors = {
            started: 'primary',
            demolded: 'warning',
            dried: 'info',
            primed: 'secondary',
            painted: 'success',
            finished: 'success',
            packaged: 'dark',
            quality_check: 'info'
        };
        return colors[action] || 'light';
    };

    const formatDate = (dateString) => {
        return moment(dateString).format('MMM DD, YYYY HH:mm');
    };

    return (
        <div className="production-container">
            <h2 className="mb-4">⚡ Production Management</h2>
            
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                <Tab eventKey="log" title="📝 Log Production">
                    <Row>
                        <Col lg={8}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FaClock className="me-2" />
                                        Production Log Entry
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        <FaCalendar className="me-2" />
                                                        Shift
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={formData.shift}
                                                        onChange={e => setFormData({...formData, shift: e.target.value})}
                                                    >
                                                        <option value="morning">Morning Shift (6:00 - 14:00)</option>
                                                        <option value="afternoon">Afternoon Shift (14:00 - 22:00)</option>
                                                        <option value="night">Night Shift (22:00 - 6:00)</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        <FaTools className="me-2" />
                                                        Workstation
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={formData.workstation}
                                                        onChange={e => setFormData({...formData, workstation: e.target.value})}
                                                    >
                                                        <option value="Station 1">Station 1 - Molding</option>
                                                        <option value="Station 2">Station 2 - Drying</option>
                                                        <option value="Station 3">Station 3 - Painting</option>
                                                        <option value="Station 4">Station 4 - Finishing</option>
                                                        <option value="Station 5">Station 5 - Packaging</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <h5 className="mb-3">
                                            <FaBox className="me-2" />
                                            Products Worked On
                                        </h5>
                                        
                                        {formData.products.map((product, index) => (
                                            <Card key={index} className="mb-3 border">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">Product {index + 1}</h6>
                                                        {formData.products.length > 1 && (
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm" 
                                                                onClick={() => removeProductField(index)}
                                                            >
                                                                <FaMinus /> Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Product *</Form.Label>
                                                                <Form.Select
                                                                    value={product.productCode}
                                                                    onChange={e => updateProductField(index, 'productCode', e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Select Product</option>
                                                                    {products.map(p => (
                                                                        <option key={p._id} value={p.productCode}>
                                                                            {p.productCode} - {p.name}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Action *</Form.Label>
                                                                <Form.Select
                                                                    value={product.action}
                                                                    onChange={e => updateProductField(index, 'action', e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Select Action</option>
                                                                    {getActionOptions().map(action => (
                                                                        <option key={action.value} value={action.value}>
                                                                            {action.label}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Quantity</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    value={product.quantity}
                                                                    onChange={e => updateProductField(index, 'quantity', parseInt(e.target.value) || 1)}
                                                                    min="1"
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Time Spent (minutes)</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    value={product.timeSpent}
                                                                    onChange={e => updateProductField(index, 'timeSpent', parseInt(e.target.value) || 0)}
                                                                    min="0"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                        
                                        <div className="text-center mb-4">
                                            <Button variant="outline-primary" onClick={addProductField}>
                                                <FaPlus /> Add Another Product
                                            </Button>
                                        </div>

                                        <h5 className="mb-3">
                                            <FaTools className="me-2" />
                                            Materials Used
                                        </h5>
                                        
                                        {formData.materialsUsed.map((material, index) => (
                                            <Card key={index} className="mb-3 border">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="mb-0">Material {index + 1}</h6>
                                                        {formData.materialsUsed.length > 1 && (
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm" 
                                                                onClick={() => removeMaterialField(index)}
                                                            >
                                                                <FaMinus /> Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Row>
                                                        <Col md={5}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Material *</Form.Label>
                                                                <Form.Select
                                                                    value={material.materialCode}
                                                                    onChange={e => updateMaterialField(index, 'materialCode', e.target.value)}
                                                                    required
                                                                >
                                                                    <option value="">Select Material</option>
                                                                    {materials.map(m => (
                                                                        <option key={m._id} value={m.materialCode}>
                                                                            {m.materialCode} - {m.name}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={3}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>Quantity *</Form.Label>
                                                                <Form.Control
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={material.quantity}
                                                                    onChange={e => updateMaterialField(index, 'quantity', parseFloat(e.target.value) || 1)}
                                                                    required
                                                                    min="0.01"
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={4}>
                                                            <Form.Group className="mb-3">
                                                                <Form.Label>For Product</Form.Label>
                                                                <Form.Select
                                                                    value={material.productCode}
                                                                    onChange={e => updateMaterialField(index, 'productCode', e.target.value)}
                                                                >
                                                                    <option value="">General Use</option>
                                                                    {products.map(p => (
                                                                        <option key={p._id} value={p.productCode}>
                                                                            {p.productCode}
                                                                        </option>
                                                                    ))}
                                                                </Form.Select>
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                        
                                        <div className="text-center mb-4">
                                            <Button variant="outline-primary" onClick={addMaterialField}>
                                                <FaPlus /> Add Another Material
                                            </Button>
                                        </div>

                                        <Form.Group className="mb-4">
                                            <Form.Label>Notes</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={formData.notes}
                                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                                placeholder="Any notes about today's production..."
                                            />
                                        </Form.Group>

                                        <div className="d-grid">
                                            <Button 
                                                variant="primary" 
                                                type="submit" 
                                                size="lg"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="me-2" />
                                                        Save Production Log
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Daily Stats */}
                            {dailyStats && (
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <FaChartLine className="me-2" />
                                            Today's Production ({moment().format('MMM DD')})
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="text-center mb-3">
                                            <h1>{dailyStats.summary?.totalProducts || 0}</h1>
                                            <p className="text-muted">Products Worked On</p>
                                        </div>
                                        
                                        {dailyStats.summary?.byStatus && (
                                            <div className="mb-3">
                                                <h6>By Status:</h6>
                                                <div className="small">
                                                    {Object.entries(dailyStats.summary.byStatus).map(([status, count]) => (
                                                        <div key={status} className="d-flex justify-content-between mb-1">
                                                            <span>{status.replace('_', ' ')}:</span>
                                                            <Badge bg={getActionColor(status)}>{count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {dailyStats.summary?.materialsUsed && Object.keys(dailyStats.summary.materialsUsed).length > 0 && (
                                            <div>
                                                <h6>Materials Used:</h6>
                                                <div className="small">
                                                    {Object.entries(dailyStats.summary.materialsUsed).map(([material, data]) => (
                                                        <div key={material} className="d-flex justify-content-between mb-1">
                                                            <span>{material}:</span>
                                                            <span>{data.quantity} {data.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Recent Logs */}
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">
                                        <FaHistory className="me-2" />
                                        Recent Production Logs
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    {logs.length > 0 ? (
                                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            {logs.map(log => (
                                                <div key={log._id} className="border-bottom pb-3 mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <strong className="small">{formatDate(log.date)}</strong>
                                                        <Badge bg="info">{log.shift}</Badge>
                                                    </div>
                                                    <div className="small text-muted mb-2">
                                                        Workstation: {log.workstation || 'Not specified'}
                                                    </div>
                                                    <div className="small">
                                                        <div className="mb-1">
                                                            <strong>Products:</strong> {log.products.length}
                                                        </div>
                                                        <div>
                                                            <strong>Materials:</strong> {log.materialsUsed.length}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert variant="info" className="mb-0">
                                            No production logs yet.
                                        </Alert>
                                    )}
                                    <div className="text-center mt-3">
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm"
                                            onClick={fetchProductionLogs}
                                        >
                                            View All Logs
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="history" title="📊 Production History">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Production History</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table hover striped>
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Shift</th>
                                            <th>Workstation</th>
                                            <th>Products</th>
                                            <th>Materials Used</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log._id}>
                                                <td>{formatDate(log.date)}</td>
                                                <td>
                                                    <Badge bg="info">{log.shift}</Badge>
                                                </td>
                                                <td>{log.workstation || '—'}</td>
                                                <td>
                                                    <div className="small">
                                                        {log.products.map((p, idx) => (
                                                            <div key={idx} className="mb-1">
                                                                <Badge bg={getActionColor(p.action)} className="me-2">
                                                                    {p.action}
                                                                </Badge>
                                                                {p.productCode} ({p.quantity})
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="small">
                                                        {log.materialsUsed.map((m, idx) => (
                                                            <div key={idx} className="mb-1">
                                                                {m.materialCode}: {m.quantity}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <Button variant="outline-info" size="sm">
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
};

export default Production;
