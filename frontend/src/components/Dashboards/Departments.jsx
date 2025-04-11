import { useEffect, useState } from "react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getColleges, getCourses } from "../../services/api";
import { Table, Button, Modal, Form } from "react-bootstrap";
import { FaBuilding, FaUniversity, FaBook, FaPlus, FaCode, FaInfoCircle, FaEdit, FaTrash } from "react-icons/fa";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    department_name: "",
    department_code: "",
    details: "",
    college_id: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [courseCount, setCourseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deptData, collegeData, coursesData] = await Promise.all([
          getDepartments(),
          getColleges(),
          getCourses()
        ]);
        setDepartments(deptData);
        setColleges(collegeData);
        setCourseCount(coursesData.length); // Set the actual course count
      } catch (err) {
        console.error("Failed to load data", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditDepartment = (department) => {
    setDepartmentToEdit(department);
    setEditMode(true);
    setFormData({
      department_name: department.department_name,
      department_code: department.department_code,
      details: department.details || "",
      college_id: department.college?.id || ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    
    try {
      await deleteDepartment(departmentToDelete.id);
      
      // Update local state
      setDepartments(departments.filter(dept => dept.id !== departmentToDelete.id));
      setSuccess("Department deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to delete department. There might be courses or users associated with it.");
    } finally {
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      department_name: "",
      department_code: "",
      details: "",
      college_id: ""
    });
    setEditMode(false);
    setDepartmentToEdit(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!formData.department_name || !formData.department_code || !formData.college_id) {
      setError("Please fill all required fields");
      return;
    }

    try {
      if (editMode && departmentToEdit) {
        // Update existing department
        const updatedDepartment = await updateDepartment(departmentToEdit.id, formData);
        
        // Update the local state with the updated department
        setDepartments(departments.map(dept => 
          dept.id === departmentToEdit.id ? updatedDepartment : dept
        ));
        
        setSuccess("Department updated successfully!");
      } else {
        // Create new department
        const newDepartment = await createDepartment(formData);
        
        // Update the local state with the new department
        setDepartments((prev) => [...prev, newDepartment]);
        
        setSuccess("Department created successfully!");
      }
      
      // Reset form and close modal after a short delay to show the success message
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        setSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to save department", err);
      setError(err.response?.data?.detail || "Failed to save department. Please try again.");
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4" role="alert">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading department data...</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="card dashboard-card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-primary">
                    <FaBuilding />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Total Departments</h6>
                    <h4 className="card-title mb-0">{departments.length}</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card dashboard-card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-success">
                    <FaBook />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Department Courses</h6>
                    <h4 className="card-title mb-0">{courseCount}</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card dashboard-card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="icon-box bg-info">
                    <FaUniversity />
                  </div>
                  <div className="ms-3">
                    <h6 className="card-subtitle text-muted">Total Colleges</h6>
                    <h4 className="card-title mb-0">{colleges.length}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><FaBuilding className="me-2" /> Departments</h5>
              <Button variant="primary" onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}>
                <FaPlus className="me-1" /> Add Department
              </Button>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="bg-light">
                    <tr>
                      <th><FaCode className="me-2" /> Department Code</th>
                      <th><FaBuilding className="me-2" /> Department Name</th>
                      <th><FaInfoCircle className="me-2" /> Details</th>
                      <th><FaUniversity className="me-2" /> College</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.id}>
                        <td>{department.department_code}</td>
                        <td>{department.department_name}</td>
                        <td>{department.details || "N/A"}</td>
                        <td>{department.college_name}</td>
                        <td>
                          <Button 
                            variant="info" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleEditDepartment(department)}
                          >
                            <FaEdit /> Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteClick(department)}
                          >
                            <FaTrash /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-3">No departments found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Department Modal */}
      <Modal
        show={isModalOpen}
        onHide={() => {
          setIsModalOpen(false);
          resetForm();
          setError(null);
          setSuccess(null);
        }}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaBuilding className="me-2" /> 
            {editMode ? 'Edit Department' : 'Add New Department'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formDepartmentName">
              <Form.Label><FaBuilding className="me-1" /> Department Name</Form.Label>
              <Form.Control
                type="text"
                name="department_name"
                value={formData.department_name}
                onChange={handleInputChange}
                required
                placeholder="Enter department name"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDepartmentCode">
              <Form.Label><FaCode className="me-1" /> Department Code</Form.Label>
              <Form.Control
                type="text"
                name="department_code"
                value={formData.department_code}
                onChange={handleInputChange}
                required
                placeholder="Enter department code (e.g., DCS)"
                maxLength="10"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formCollege">
              <Form.Label><FaUniversity className="me-1" /> College</Form.Label>
              <Form.Select 
                name="college_id"
                value={formData.college_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a college</option>
                {colleges.map(college => (
                  <option key={college.id} value={college.id}>
                    {college.name} ({college.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDetails">
              <Form.Label><FaInfoCircle className="me-1" /> Details</Form.Label>
              <Form.Control
                as="textarea"
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={3}
                placeholder="Optional department details"
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button variant="success" type="submit">
                {editMode ? 'Update Department' : 'Create Department'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {departmentToDelete && (
            <p>
              Are you sure you want to delete the department "{departmentToDelete.department_name}"? 
              This action cannot be undone and may affect courses and users associated with this department.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Departments;
