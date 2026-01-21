import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { 
    FaHome, FaBox, FaPaintBrush, FaCubes, 
    FaChartBar, FaSignOutAlt, FaUser, FaBell,
    FaCog, FaQuestionCircle, FaBars
} from 'react-icons/fa';

const PaintelloNavbar = ({ user, logout }) => {
    const notifications = 3; // This would come from your state/API

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" sticky="top">
            <Container fluid>
                <Navbar.Brand href="/" className="fw-bold">
                    <FaPaintBrush className="me-2" />
                    Paintello Atelier
                    <Badge bg="light" text="dark" className="ms-2 small">
                        v1.0
                    </Badge>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav">
                    <FaBars />
                </Navbar.Toggle>
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <LinkContainer to="/" exact>
                            <Nav.Link>
                                <FaHome className="me-1" /> Dashboard
                            </Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/products">
                            <Nav.Link>
                                <FaBox className="me-1" /> Products
                            </Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/production">
                            <Nav.Link>
                                <FaPaintBrush className="me-1" /> Production
                            </Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/materials">
                            <Nav.Link>
                                <FaCubes className="me-1" /> Materials
                            </Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/reports">
                            <Nav.Link>
                                <FaChartBar className="me-1" /> Reports
                            </Nav.Link>
                        </LinkContainer>
                    </Nav>
                    
                    <Nav className="align-items-center">
                        {/* Notifications */}
                        <Dropdown align="end" className="me-3">
                            <Dropdown.Toggle variant="outline-light" className="position-relative">
                                <FaBell />
                                {notifications > 0 && (
                                    <Badge 
                                        bg="danger" 
                                        pill 
                                        className="position-absolute top-0 start-100 translate-middle"
                                        style={{ fontSize: '0.6rem' }}
                                    >
                                        {notifications}
                                    </Badge>
                                )}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Header>Notifications</Dropdown.Header>
                                <Dropdown.Item>
                                    <div className="small">
                                        <strong>Low stock alert</strong>
                                        <div className="text-muted">White cement is running low</div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <div className="small">
                                        <strong>Production complete</strong>
                                        <div className="text-muted">10 statues finished</div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item className="text-center">
                                    <small>View all notifications</small>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        
                        {/* User Menu */}
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                                <FaUser className="me-2" />
                                {user?.username || 'User'}
                                <Badge bg={user?.role === 'admin' ? 'danger' : 'info'} className="ms-2">
                                    {user?.role || 'User'}
                                </Badge>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Header>
                                    <div className="small">
                                        <strong>{user?.username || 'User'}</strong>
                                        <div className="text-muted">{user?.email || ''}</div>
                                    </div>
                                </Dropdown.Header>
                                <Dropdown.Divider />
                                <Dropdown.Item>
                                    <FaUser className="me-2" />
                                    My Profile
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <FaCog className="me-2" />
                                    Settings
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <FaQuestionCircle className="me-2" />
                                    Help & Support
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={logout} className="text-danger">
                                    <FaSignOutAlt className="me-2" />
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default PaintelloNavbar;
