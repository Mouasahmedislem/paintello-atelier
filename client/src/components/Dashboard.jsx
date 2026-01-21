import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Row, Col, ProgressBar, Alert, Spinner,
  Table, Badge 
} from 'react-bootstrap';
import { 
  FaBox, FaPaintBrush, FaCheckCircle, 
  FaExclamationTriangle, FaChartLine,
  FaCubes, FaPalette, FaShippingFast
} from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inProduction: 0,
    finished: 0,
    lowStock: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [productionData, setProductionData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, materialsRes, statsRes] = await Promise.all([
        axios.get('/api/products?limit=5'),
        axios.get('/api/materials/low-stock'),
        axios.get('/api/products/stats')
      ]);

      const products = productsRes.data.data || [];
      const lowStock = materialsRes.data.data || [];
      const productStats = statsRes.data.data || {};

      setRecentProducts(products);
      setLowStockItems(lowStock);

      // Calculate stats
      const statusCounts = productStats.byStatus || [];
      const finishedCount = statusCounts.find(s => s.status === 'finished')?.count || 0;
      const inProductionCount = statusCounts
        .filter(s => ['molding', 'ready_to_paint', 'painting'].includes(s.status))
        .reduce((sum, s) => sum + s.count, 0);

      setStats({
        totalProducts: productStats.totalProducts || 0,
        inProduction: inProductionCount,
        finished: finishedCount,
        lowStock: lowStock.length
      });

      // Prepare chart data
      setProductionData({
        labels: statusCounts.map(s => s.status.replace('_', ' ').toUpperCase()),
        datasets: [{
          label: 'Products by Status',
          data: statusCounts.map(s => s.count),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384'
          ]
        }]
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      molding: 'secondary',
      demolded: 'warning',
      drying: 'info',
      ready_to_paint: 'primary',
      painting: 'info',
      finished: 'success',
      packaged: 'dark',
      shipped: 'success'
    };
    return variants[status] || 'light';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2 className="mb-4">🎨 Paintello Atelier Dashboard</h2>
      
      {/* Stats Cards */}
      <Row className="mb-4 g-4">
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <FaCubes className="stat-icon text-primary mb-3" size={32} />
              <Card.Title className="display-6 fw-bold">{stats.totalProducts}</Card.Title>
              <Card.Text className="text-muted">Total Products</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <FaPaintBrush className="stat-icon text-warning mb-3" size={32} />
              <Card.Title className="display-6 fw-bold">{stats.inProduction}</Card.Title>
              <Card.Text className="text-muted">In Production</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <FaCheckCircle className="stat-icon text-success mb-3" size={32} />
              <Card.Title className="display-6 fw-bold">{stats.finished}</Card.Title>
              <Card.Text className="text-muted">Finished</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="stat-card h-100">
            <Card.Body className="text-center">
              <FaExclamationTriangle className="stat-icon text-danger mb-3" size={32} />
              <Card.Title className="display-6 fw-bold">{stats.lowStock}</Card.Title>
              <Card.Text className="text-muted">Low Stock Items</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Low Stock Alert:</strong> {lowStockItems.length} materials are below minimum threshold
          <ul className="mb-0 mt-2">
            {lowStockItems.slice(0, 3).map((item, index) => (
              <li key={index}>
                {item.name}: {item.currentStock}{item.unit} (min: {item.minThreshold}{item.unit})
              </li>
            ))}
            {lowStockItems.length > 3 && (
              <li>... and {lowStockItems.length - 3} more</li>
            )}
          </ul>
        </Alert>
      )}

      {/* Main Content */}
      <Row className="g-4">
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Recent Products</h5>
            </Card.Header>
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Quantity</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.map(product => (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.productCode}</strong>
                      </td>
                      <td>{product.name}</td>
                      <td>
                        <Badge bg="info">
                          {product.category}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadge(product.status)}>
                          {product.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>{product.quantity}</td>
                      <td>{product.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Production Status</h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div style={{ height: '250px' }}>
                {productionData.labels ? (
                  <Doughnut 
                    data={productionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Production Progress</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Completion Rate</span>
                  <span>
                    {stats.totalProducts > 0 
                      ? `${Math.round((stats.finished / stats.totalProducts) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <ProgressBar 
                  now={stats.totalProducts > 0 ? (stats.finished / stats.totalProducts) * 100 : 0}
                  variant="success"
                  animated
                />
              </div>
              
              <div className="small text-muted">
                <div className="d-flex justify-content-between">
                  <span>In Production:</span>
                  <span>{stats.inProduction}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Finished Today:</span>
                  <span>—</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Pending Orders:</span>
                  <span>—</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
