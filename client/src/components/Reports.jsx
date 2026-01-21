import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Card, Table, Button, Row, Col, Form, 
    Alert, Dropdown, ProgressBar, Badge,
    Tabs, Tab, Modal
} from 'react-bootstrap';
import { 
    FaFileExcel, FaChartBar, FaCalendar, FaDownload,
    FaFilter, FaPrint, FaChartPie, FaChartLine,
    FaBox, FaPaintBrush, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const [dailyReport, setDailyReport] = useState(null);
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [monthlyReport, setMonthlyReport] = useState(null);
    const [productivityData, setProductivityData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
    });
    const [activeTab, setActiveTab] = useState('daily');

    useEffect(() => {
        fetchDailyReport();
    }, []);

    const fetchDailyReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/daily');
            setDailyReport(response.data);
        } catch (error) {
            console.error('Error fetching daily report:', error);
            toast.error('Failed to load daily report');
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/weekly');
            setWeeklyReport(response.data);
        } catch (error) {
            console.error('Error fetching weekly report:', error);
            toast.error('Failed to load weekly report');
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyReport = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/reports/monthly');
            setMonthlyReport(response.data);
        } catch (error) {
            console.error('Error fetching monthly report:', error);
            toast.error('Failed to load monthly report');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductivityData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/production/performance');
            setProductivityData(response.data);
        } catch (error) {
            console.error('Error fetching productivity data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.get('/api/reports/export/excel', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `paintello-report-${moment().format('YYYY-MM-DD')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            toast.success('Report exported successfully');
        } catch (error) {
            toast.error('Error exporting report');
        }
    };

    const handleTabSelect = (tab) => {
        setActiveTab(tab);
        switch(tab) {
            case 'weekly':
                if (!weeklyReport) fetchWeeklyReport();
                break;
            case 'monthly':
                if (!monthlyReport) fetchMonthlyReport();
                break;
            case 'productivity':
                if (!productivityData) fetchProductivityData();
                break;
            default:
                break;
        }
    };

    // Prepare chart data for daily production
    const getDailyChartData = () => {
        if (!dailyReport || !dailyReport.summary?.byStatus) return null;

        const labels = Object.keys(dailyReport.summary.byStatus).map(key => 
            key.replace('_', ' ').toUpperCase()
        );
        const data = Object.values(dailyReport.summary.byStatus);

        return {
            labels,
            datasets: [
                {
                    label: 'Products by Status',
                    data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 1
                }
            ]
        };
    };

    // Prepare chart data for weekly production
    const getWeeklyChartData = () => {
        if (!weeklyReport || !weeklyReport.dailyData) return null;

        const labels = weeklyReport.dailyData.map(day => 
            moment(day.date).format('ddd')
        );
        const productsData = weeklyReport.dailyData.map(day => day.products);
        const finishedData = weeklyReport.dailyData.map(day => day.finished);

        return {
            labels,
            datasets: [
                {
                    label: 'Products Worked On',
                    data: productsData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Finished Products',
                    data: finishedData,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2
                }
            ]
        };
    };

    const getMaterialConsumptionData = () => {
        if (!dailyReport || !dailyReport.summary?.materialsUsed) return null;

        const labels = Object.keys(dailyReport.summary.materialsUsed);
        const data = labels.map(label => dailyReport.summary.materialsUsed[label].quantity);

        return {
            labels,
            datasets: [
                {
                    label: 'Materials Used Today',
                    data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384'
                    ]
                }
            ]
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Production Overview'
            }
        }
    };

    if (loading && !dailyReport) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📊 Reports & Analytics</h2>
                <div>
                    <Button variant="outline-primary" className="me-2">
                        <FaPrint /> Print
                    </Button>
                    <Button variant="success" onClick={handleExportExcel}>
                        <FaFileExcel /> Export to Excel
                    </Button>
                </div>
            </div>

            <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-4">
                <Tab eventKey="daily" title={
                    <>
                        <FaCalendar className="me-2" />
                        Daily Report
                    </>
                }>
                    {dailyReport && (
                        <Row>
                            <Col lg={8}>
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            Daily Production Summary - {moment().format('MMMM DD, YYYY')}
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="mb-4">
                                            <Col md={3} className="text-center">
                                                <div className="display-4 text-primary">
                                                    {dailyReport.summary?.totalProducts || 0}
                                                </div>
                                                <p className="text-muted">Total Products</p>
                                            </Col>
                                            <Col md={3} className="text-center">
                                                <div className="display-4 text-success">
                                                    {Object.entries(dailyReport.summary?.byStatus || {})
                                                        .find(([status]) => status === 'finished')?.[1] || 0}
                                                </div>
                                                <p className="text-muted">Finished Today</p>
                                            </Col>
                                            <Col md={3} className="text-center">
                                                <div className="display-4 text-warning">
                                                    {dailyReport.summary?.lowStock?.length || 0}
                                                </div>
                                                <p className="text-muted">Low Stock Items</p>
                                            </Col>
                                            <Col md={3} className="text-center">
                                                <div className="display-4 text-info">
                                                    {Object.keys(dailyReport.summary?.materialsUsed || {}).length}
                                                </div>
                                                <p className="text-muted">Materials Used</p>
                                            </Col>
                                        </Row>

                                        {/* Production Status Chart */}
                                        <div className="mb-4">
                                            <h5>Production Status Distribution</h5>
                                            <div style={{ height: '300px' }}>
                                                {getDailyChartData() && (
                                                    <Bar data={getDailyChartData()} options={chartOptions} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Materials Used Chart */}
                                        <div className="mb-4">
                                            <h5>Materials Used Today</h5>
                                            <div style={{ height: '250px' }}>
                                                {getMaterialConsumptionData() && (
                                                    <Pie data={getMaterialConsumptionData()} options={chartOptions} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Low Stock Items */}
                                        {dailyReport.summary?.lowStock && dailyReport.summary.lowStock.length > 0 && (
                                            <Card className="border-warning">
                                                <Card.Header className="bg-warning text-white">
                                                    <h5 className="mb-0">
                                                        <FaExclamationTriangle className="me-2" />
                                                        Low Stock Alerts
                                                    </h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <Table striped hover size="sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Material</th>
                                                                <th>Current Stock</th>
                                                                <th>Minimum Required</th>
                                                                <th>Unit</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {dailyReport.summary.lowStock.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>{item.name}</td>
                                                                    <td>
                                                                        <strong className={item.current < item.min ? 'text-danger' : ''}>
                                                                            {item.current}
                                                                        </strong>
                                                                    </td>
                                                                    <td>{item.min}</td>
                                                                    <td>{item.unit}</td>
                                                                    <td>
                                                                        {item.current === 0 ? (
                                                                            <Badge bg="danger">Out of Stock</Badge>
                                                                        ) : (
                                                                            <Badge bg="warning">Low Stock</Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Card.Body>
                                            </Card>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                {/* Quick Stats */}
                                <Card className="mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">Today's Quick Stats</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {dailyReport.summary?.byStatus && (
                                            <div className="mb-4">
                                                <h6>Production by Status:</h6>
                                                {Object.entries(dailyReport.summary.byStatus).map(([status, count]) => (
                                                    <div key={status} className="mb-2">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span>{status.replace('_', ' ')}:</span>
                                                            <strong>{count}</strong>
                                                        </div>
                                                        <ProgressBar 
                                                            now={(count / dailyReport.summary.totalProducts) * 100}
                                                            label={`${Math.round((count / dailyReport.summary.totalProducts) * 100)}%`}
                                                            variant={status === 'finished' ? 'success' : 'primary'}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Recent Production Activity */}
                                        <div>
                                            <h6>Recent Activity</h6>
                                            {dailyReport.logs && dailyReport.logs.slice(0, 5).map((log, index) => (
                                                <div key={index} className="border-bottom pb-2 mb-2">
                                                    <div className="small">
                                                        <strong>{log.operator || 'Unknown'}</strong>
                                                        <div className="text-muted">
                                                            {log.products} products, {log.materials} materials
                                                        </div>
                                                        <small className="text-muted">
                                                            {log.notes && log.notes.substring(0, 40)}...
                                                        </small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>

                                {/* Material Usage Summary */}
                                <Card>
                                    <Card.Header>
                                        <h5 className="mb-0">Material Usage</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {dailyReport.summary?.materialsUsed && Object.keys(dailyReport.summary.materialsUsed).length > 0 ? (
                                            <div>
                                                {Object.entries(dailyReport.summary.materialsUsed).map(([material, data]) => (
                                                    <div key={material} className="mb-2">
                                                        <div className="d-flex justify-content-between">
                                                            <span>{material}:</span>
                                                            <strong>{data.quantity} {data.unit}</strong>
                                                        </div>
                                                        <ProgressBar 
                                                            now={100}
                                                            variant="info"
                                                            style={{ height: '5px' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Alert variant="info" className="mb-0">
                                                No materials used today.
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Tab>

                <Tab eventKey="weekly" title={
                    <>
                        <FaChartLine className="me-2" />
                        Weekly Report
                    </>
                }>
                    {weeklyReport ? (
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">
                                    Weekly Production Report ({weeklyReport.period?.start} to {weeklyReport.period?.end})
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="mb-4">
                                    <Col md={3}>
                                        <Card className="text-center">
                                            <Card.Body>
                                                <div className="display-4">{weeklyReport.summary?.totalProducts || 0}</div>
                                                <p className="text-muted">Total Products</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center">
                                            <Card.Body>
                                                <div className="display-4 text-success">
                                                    {weeklyReport.summary?.finishedProducts || 0}
                                                </div>
                                                <p className="text-muted">Finished Products</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center">
                                            <Card.Body>
                                                <div className="display-4 text-warning">
                                                    {weeklyReport.summary?.lowStockMaterials || 0}
                                                </div>
                                                <p className="text-muted">Low Stock Items</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md={3}>
                                        <Card className="text-center">
                                            <Card.Body>
                                                <div className="display-4 text-info">
                                                    {weeklyReport.summary?.totalLogs || 0}
                                                </div>
                                                <p className="text-muted">Production Logs</p>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>

                                <div className="mb-4" style={{ height: '400px' }}>
                                    {getWeeklyChartData() && (
                                        <Line 
                                            data={getWeeklyChartData()} 
                                            options={{
                                                ...chartOptions,
                                                plugins: {
                                                    ...chartOptions.plugins,
                                                    title: {
                                                        ...chartOptions.plugins.title,
                                                        text: 'Weekly Production Trend'
                                                    }
                                                }
                                            }} 
                                        />
                                    )}
                                </div>

                                <h5>Daily Breakdown</h5>
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Products Worked On</th>
                                            <th>Finished Products</th>
                                            <th>Materials Used</th>
                                            <th>Efficiency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {weeklyReport.dailyData?.map((day, index) => (
                                            <tr key={index}>
                                                <td>{day.date}</td>
                                                <td>{day.products}</td>
                                                <td>
                                                    <Badge bg={day.finished > 0 ? 'success' : 'secondary'}>
                                                        {day.finished}
                                                    </Badge>
                                                </td>
                                                <td>{Object.keys(day.materialsUsed || {}).length}</td>
                                                <td>
                                                    <ProgressBar 
                                                        now={day.finished > 0 ? (day.finished / day.products) * 100 : 0}
                                                        label={`${day.finished > 0 ? Math.round((day.finished / day.products) * 100) : 0}%`}
                                                        variant={day.finished > 0 ? 'success' : 'secondary'}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Alert variant="info">
                            <div className="text-center py-4">
                                <div className="spinner-border me-2" role="status"></div>
                                Loading weekly report...
                            </div>
                        </Alert>
                    )}
                </Tab>

                <Tab eventKey="productivity" title={
                    <>
                        <FaChartPie className="me-2" />
                        Productivity
                    </>
                }>
                    {productivityData ? (
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Production Performance</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={8}>
                                        <h5>Key Performance Indicators</h5>
                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <Card className="mb-3">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center">
                                                            <div className="me-3">
                                                                <FaBox className="display-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h3>{productivityData.data?.totalProducts || 0}</h3>
                                                                <p className="text-muted mb-0">Total Products</p>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col md={6}>
                                                <Card className="mb-3">
                                                    <Card.Body>
                                                        <div className="d-flex align-items-center">
                                                            <div className="me-3">
                                                                <FaCheckCircle className="display-4 text-success" />
                                                            </div>
                                                            <div>
                                                                <h3>{productivityData.data?.finishedProducts || 0}</h3>
                                                                <p className="text-muted mb-0">Completed</p>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>

                                        <div className="mb-4">
                                            <h6>Completion Rate</h6>
                                            <ProgressBar 
                                                now={productivityData.data?.completionRate || 0}
                                                label={`${productivityData.data?.completionRate || 0}%`}
                                                variant="success"
                                                animated
                                                style={{ height: '30px' }}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <h6>Average Time per Product</h6>
                                            <div className="display-4">
                                                {productivityData.data?.averageTimePerProduct || 0} min
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <Card>
                                            <Card.Header>
                                                <h6 className="mb-0">Performance Metrics</h6>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-3">
                                                    <strong>Efficiency Score</strong>
                                                    <div className="display-3 text-center">
                                                        {productivityData.data?.efficiency ? 
                                                            `${productivityData.data.efficiency.toFixed(1)}%` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <strong>Total Logs</strong>
                                                    <div className="h4">
                                                        {productivityData.data?.totalLogs || 0}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong>Period</strong>
                                                    <div className="text-muted">
                                                        {productivityData.data?.weekStart} to {productivityData.data?.weekEnd}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Alert variant="info">
                            <div className="text-center py-4">
                                <div className="spinner-border me-2" role="status"></div>
                                Loading productivity data...
                            </div>
                        </Alert>
                    )}
                </Tab>
            </Tabs>

            {/* Quick Actions */}
            <Card>
                <Card.Header>
                    <h5 className="mb-0">Quick Report Actions</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Button variant="outline-primary" className="w-100 mb-2">
                                <FaDownload className="me-2" />
                                Download PDF
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-secondary" className="w-100 mb-2">
                                <FaFilter className="me-2" />
                                Custom Filter
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-info" className="w-100 mb-2">
                                <FaChartBar className="me-2" />
                                Generate Charts
                            </Button>
                        </Col>
                        <Col md={3}>
                            <Button variant="outline-success" className="w-100 mb-2" onClick={handleExportExcel}>
                                <FaFileExcel className="me-2" />
                              Export All Data
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Reports;
