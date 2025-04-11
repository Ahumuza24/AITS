// frontend/src/services/api.js
import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        if (response.data.access) {
          localStorage.setItem("access_token", response.data.access);
          // Update the auth header for the original request
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${response.data.access}`;
          // Retry the original request
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        console.warn("Token refresh failed:", refreshError.message);
        
        // Only logout if this wasn't a health check
        if (!originalRequest.url.includes('/health/')) {
          logout();
        }
        return Promise.reject(refreshError);
      }
    }

    // For 404 errors, log a more helpful message
    if (error.response?.status === 404) {
      console.warn(`Endpoint not found: ${error.config.url}`);
    }

    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register/`, userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Auth service functions
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/token/`, {
      email,
      password,
    });

    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      // Get user data after successful login
      const userResponse = await api.get("/users/me/");
      if (userResponse.data) {
        localStorage.setItem("user", JSON.stringify(userResponse.data));
      }

      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "/login"; // Forces full reload
};

export const getCurrentUser = async () => {
  // First check localStorage for cached user data
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      // If JSON parsing fails, clear the invalid data
      localStorage.removeItem("user");
      console.error("Error parsing user data:", e);
    }
  }

  // Only try API if we have an access token
  const token = localStorage.getItem("access_token");
  if (!token) {
    return null;
  }

  try {
    const response = await api.get("/users/me/");
    if (response && response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    // If unauthorized, clear user data
    if (error.response?.status === 401) {
      logout();
    }
    return null;
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_URL}/users/token/refresh/`, {
      refresh: refreshToken,
    });

    if (response.data.access) {
      localStorage.setItem("access_token", response.data.access);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    logout();
    throw error;
  }
};

// Dashboard API functions
export const getStudentDashboard = async () => {
  try {
    const response = await api.get("/dashboard/student/");
    return response.data;
  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    throw error;
  }
};

export const getLecturerDashboard = async () => {
  try {
    const response = await api.get("/dashboard/lecturer/");
    return response.data;
  } catch (error) {
    console.error("Error fetching lecturer dashboard:", error);
    // Return mock data instead of throwing error
    console.log("Providing mock lecturer dashboard data");
    return {
      total_issues: 0,
      assigned_issues: 0,
      solved_issues: 0,
      recent_issues: [],
      issue_statistics: {
        pending: 0,
        in_progress: 0,
        solved: 0
      }
    };
  }
};

export const getAdminDashboard = async () => {
  try {
    const response = await api.get("/dashboard/admin/");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    throw error;
  }
};

// services/api.js (or your API utility file)
export const getUsers = async () => {
  try {
    const response = await api.get("/users/users/");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Function to update a user
export const updateUser = async (userId, userData) => {
  try {
    // Ensure we're sending the data in the format expected by the backend
    const formattedData = { ...userData };
    
    // Format department if needed
    if (userData.department_code) {
      // We're already handling department_code in the backend
      console.log(`Updating user ${userId} with department code: ${userData.department_code}`);
    }
    
    const response = await api.put(`/users/users/${userId}/`, formattedData);
    
    // If the update was successful, fetch the complete user data to ensure we have all relationships
    if (response.status === 200) {
      const updatedUserResponse = await api.get(`/users/users/${userId}/`);
      return updatedUserResponse.data;
    }
    
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Function to delete a user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/users/${userId}/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getLecturers = async () => {
  try {
    const response = await api.get("/users/users/");
    const data = response.data;
    // Filter the data to only include lecturers
    const lecturers = data.filter((user) => user.role === "LECTURER");
    return lecturers;
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return [];
  }
};

// College API functions
export const createCollege = async (collegeData) => {
  try {
    const response = await api.post("/admin/api/college/add/", collegeData);
    return response.data;
  } catch (error) {
    console.error("Error creating college:", error);
    throw error;
  }
};

export const updateCollege = async (collegeId, collegeData) => {
  try {
    const response = await api.put(`/college/${collegeId}/`, collegeData);
    return response.data;
  } catch (error) {
    console.error("Error updating college:", error);
    throw error;
  }
};

export const deleteCollege = async (collegeId) => {
  try {
    const response = await api.delete(`/college/${collegeId}/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting college:", error);
    throw error;
  }
};

export const getColleges = async () => {
  const token = localStorage.getItem("access_token");

  try {
    // Use the axios instance with auth interceptors
    const response = await api.get("/college/");
    return response.data;
  } catch (error) {
    console.error("Error fetching colleges:", error);
    throw error;
  }
};

export const getDepartments = async () => {
  try {
    // Use the api instance which already has token handling
    const response = await api.get("/department/");
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

export const createDepartment = async (departmentData) => {
  try {
    const response = await api.post(
      "/admin/api/department/add/",
      departmentData
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error creating department:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateDepartment = async (departmentId, departmentData) => {
  try {
    const response = await api.put(`/department/${departmentId}/`, departmentData);
    return response.data;
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
};

export const deleteDepartment = async (departmentId) => {
  try {
    const response = await api.delete(`/department/${departmentId}/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
};

export const getIssues = async () => {
  try {
    // Use the api instance which already has token handling
    const response = await api.get("/issues/");
    return response.data;
  } catch (error) {
    console.error("Error fetching issues:", error);
    throw error;
  }
};

export const createIssue = async (issueData) => {
  try {
    const response = await api.post("/admin/api/issue/add/", issueData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating issue:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getCourses = async () => {
  try {
    const response = await api.get("/course/");
    return response.data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const response = await api.post("/admin/api/course/add/", courseData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating course:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/course/${courseId}/`, courseData);
    return response.data;
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/course/${courseId}/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

/**
 * Fetches all issues related to a specific department 
 * @param {number|string} departmentId - The ID of the department
 * @returns {Promise<{issues: Array, error: string|null}>}
 */
export const getDepartmentIssues = async (departmentId) => {
  if (!departmentId) {
    console.warn('getDepartmentIssues called without department ID');
    return { issues: [], error: 'Department ID is required' };
  }

  // Ensure departmentId is a string for consistent comparison
  const deptId = String(departmentId);
  
  try {
    console.log(`Fetching issues for department ${deptId}`);
    
    // Fetch all issues from the API
    const response = await api.get("/issues/");
    
    if (!response.data) {
      console.error('No issue data received from API');
      throw new Error('No data received from API');
    }
    
    console.log(`Received ${response.data.length} issues from API`);
    
    const allIssues = response.data;
    
    // Filter issues related to the department
    // This filters issues where:
    // 1. The course is in the department
    // 2. The assigned staff is in the department
    const departmentIssues = allIssues.filter(issue => {
      // Skip null or undefined issues
      if (!issue) return false;
      
      // For debugging
      console.log(`Checking issue ID ${issue.id}:`, {
        courseId: issue.course?.id,
        courseDept: issue.course?.department,
        assignedToId: issue.assigned_to?.id,
        assignedToDept: issue.assigned_to?.department
      });
      
      // Check if course belongs to the department - handle different formats
      let courseDepartmentId = null;
      if (issue.course) {
        if (typeof issue.course.department === 'object' && issue.course.department !== null) {
          courseDepartmentId = String(issue.course.department.id);
        } else if (typeof issue.course.department === 'number' || typeof issue.course.department === 'string') {
          courseDepartmentId = String(issue.course.department);
        } else if (issue.course.department_id) {
          courseDepartmentId = String(issue.course.department_id);
        }
      }
      
      // Check if assigned staff belongs to the department - handle different formats
      let staffDepartmentId = null;
      if (issue.assigned_to) {
        if (typeof issue.assigned_to.department === 'object' && issue.assigned_to.department !== null) {
          staffDepartmentId = String(issue.assigned_to.department.id);
        } else if (typeof issue.assigned_to.department === 'number' || typeof issue.assigned_to.department === 'string') {
          staffDepartmentId = String(issue.assigned_to.department);
        } else if (issue.assigned_to.department_id) {
          staffDepartmentId = String(issue.assigned_to.department_id);
        }
      }
      
      // Issue belongs to department if either course or assigned staff is in the department
      return (
        (courseDepartmentId && courseDepartmentId === deptId) ||
        (staffDepartmentId && staffDepartmentId === deptId)
      );
    });
    
    console.log(`Found ${departmentIssues.length} issues for department ${deptId}`);
    return { issues: departmentIssues, error: null };
    
  } catch (error) {
    console.error("Error fetching department issues:", error);
    
    // Check if the error is due to a network issue or API availability
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      console.warn("Network issue detected, providing mock issue data");
      return { 
        issues: [
          {
            id: 1,
            title: "Sample Network Issue",
            description: "This is a sample issue for testing during network issues",
            status: "Pending",
            created_at: new Date().toISOString(),
            student: { id: 1, first_name: "Test", last_name: "Student" },
            course: { id: 1, course_name: "Test Course", department: departmentId },
            assigned_to: null
          }
        ], 
        error: null 
      };
    }
    
    // Provide mock data for testing if the endpoint returns 404
    if (error.response && error.response.status === 404) {
      console.log("Issues endpoint not found, providing mock data");
      return { 
        issues: [
          {
            id: 1,
            title: "Sample Issue 1",
            description: "This is a sample issue for testing",
            status: "Pending",
            created_at: new Date().toISOString(),
            student: { id: 1, first_name: "Test", last_name: "Student" },
            course: { id: 1, course_name: "Test Course", department: departmentId },
            assigned_to: { id: 1, first_name: "Test", last_name: "Lecturer", department: departmentId }
          },
          {
            id: 2,
            title: "Sample Issue 2",
            description: "Another sample issue for testing",
            status: "In Progress",
            created_at: new Date().toISOString(),
            student: { id: 2, first_name: "Another", last_name: "Student" },
            course: { id: 2, course_name: "Another Course", department: departmentId },
            assigned_to: null
          }
        ], 
        error: null 
      };
    }
    
    return { 
      issues: [], 
      error: `Failed to fetch department issues: ${error.message}`
    };
  }
};

/**
 * Fetches staff (lecturers) who belong to a specific department
 * @param {number|string} departmentId - The ID of the department
 * @returns {Promise<{staff: Array, error: string|null}>}
 */
export const getDepartmentStaff = async (departmentId) => {
  if (!departmentId) {
    console.warn('getDepartmentStaff called without department ID');
    return { staff: [], error: 'Department ID is required' };
  }

  // Ensure departmentId is a string for consistent comparison
  const deptId = String(departmentId);
  
  try {
    console.log(`Fetching staff for department ${deptId}`);
    
    // Get all users/staff
    const response = await api.get("/users/users/");
    
    if (!response.data) {
      console.error('No user data received from API');
      throw new Error('No data received from API');
    }
    
    console.log(`Received ${response.data.length} users from API`);
    
    // Filter for staff in this department with LECTURER or HOD role
    const departmentStaff = response.data.filter(user => {
      // For debugging
      console.log(`Checking user:`, {
        userId: user.id,
        userRole: user.role,
        userDepartment: user.department,
        userDepartmentType: typeof user.department
      });
      
      // Check if user has a department and role
      if (!user.role || !(user.role === 'LECTURER' || user.role === 'HOD')) {
        return false;
      }
      
      // Check department using different possible formats
      let userDeptId = null;
      
      if (typeof user.department === 'object' && user.department !== null) {
        userDeptId = String(user.department.id);
      } else if (typeof user.department === 'number' || typeof user.department === 'string') {
        userDeptId = String(user.department);
      } else if (user.department_id) {
        userDeptId = String(user.department_id);
      }
      
      return userDeptId === deptId;
    });
    
    console.log(`Found ${departmentStaff.length} staff members for department ${deptId}`);
    return { staff: departmentStaff, error: null };
    
  } catch (error) {
    console.error("Error fetching department staff:", error);
    
    // Check if the error is due to a network issue or API availability
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      console.warn("Network issue detected, providing mock staff data");
      return { 
        staff: [
          {
            id: 1,
            first_name: "John",
            last_name: "Smith",
            title: "Dr.",
            email: "john.smith@example.com",
            role: "LECTURER",
            department: departmentId
          },
          {
            id: 2,
            first_name: "Jane",
            last_name: "Doe",
            title: "Prof.",
            email: "jane.doe@example.com",
            role: "HOD",
            department: departmentId
          }
        ], 
        error: null 
      };
    }
    
    // Provide mock data for testing if the endpoint returns 404
    if (error.response && error.response.status === 404) {
      console.log("Users endpoint not found, providing mock data");
      return { 
        staff: [
          {
            id: 1,
            first_name: "John",
            last_name: "Smith",
            title: "Dr.",
            email: "john.smith@example.com",
            role: "LECTURER",
            department: departmentId
          },
          {
            id: 2,
            first_name: "Jane",
            last_name: "Doe",
            title: "Prof.",
            email: "jane.doe@example.com",
            role: "HOD",
            department: departmentId
          }
        ], 
        error: null 
      };
    }
    
    return { 
      staff: [], 
      error: `Failed to fetch department staff: ${error.message}`
    };
  }
};

/**
 * Fetches courses that belong to a specific department
 * @param {number|string} departmentId - The ID of the department
 * @returns {Promise<{courses: Array, error: string|null}>}
 */
export const getDepartmentCourses = async (departmentId) => {
  if (!departmentId) {
    console.warn('getDepartmentCourses called without department ID');
    return { courses: [], error: 'Department ID is required' };
  }

  // Ensure departmentId is a string for consistent comparison
  const deptId = String(departmentId);
  
  try {
    console.log(`Fetching courses for department ${deptId}`);
    
    // Get all courses
    const response = await api.get("/course/");
    
    if (!response.data) {
      console.error('No course data received from API');
      throw new Error('No data received from API');
    }
    
    console.log(`Received ${response.data.length} courses from API`);
    
    // Filter for courses in this department
    const departmentCourses = response.data.filter(course => {
      // For debugging
      console.log(`Checking course ID ${course.id}:`, {
        deptId: deptId,
        courseDept: course.department,
        courseDeptType: typeof course.department
      });
      
      // Handle different formats of department field
      let courseDepartmentId = null;
      
      if (typeof course.department === 'object' && course.department !== null) {
        courseDepartmentId = String(course.department.id);
      } else if (typeof course.department === 'number' || typeof course.department === 'string') {
        courseDepartmentId = String(course.department);
      } else if (course.department_id) {
        courseDepartmentId = String(course.department_id);
      }
      
      return courseDepartmentId === deptId;
    });
    
    console.log(`Found ${departmentCourses.length} courses for department ${deptId}`);
    return { courses: departmentCourses, error: null };
    
  } catch (error) {
    console.error("Error fetching department courses:", error);
    
    // Check if the error is due to a network issue or API availability
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      console.warn("Network issue detected, providing mock course data");
      return { 
        courses: [
          {
            id: 1,
            course_code: "CS101",
            course_name: "Introduction to Computer Science",
            department: departmentId,
            details: "An introductory course to computer science principles"
          },
          {
            id: 2,
            course_code: "CS201",
            course_name: "Data Structures",
            department: departmentId,
            details: "A course on fundamental data structures and algorithms"
          }
        ],
        error: null 
      };
    }
    
    // Provide mock data for testing if the endpoint returns 404
    if (error.response && error.response.status === 404) {
      console.log("Courses endpoint not found, providing mock data");
      return { 
        courses: [
          {
            id: 1,
            course_code: "CS101",
            course_name: "Introduction to Computer Science",
            department: departmentId,
            details: "An introductory course to computer science principles"
          },
          {
            id: 2,
            course_code: "CS201",
            course_name: "Data Structures",
            department: departmentId,
            details: "A course on fundamental data structures and algorithms"
          }
        ], 
        error: null 
      };
    }
    
    return { 
      courses: [], 
      error: `Failed to fetch department courses: ${error.message}`
    };
  }
};

/**
 * Fetches details of a specific department
 * @param {number|string} departmentId - The ID of the department
 * @returns {Promise<{department: Object|null, error: string|null}>}
 */
export const getDepartmentDetails = async (departmentId) => {
  if (!departmentId) {
    console.warn('getDepartmentDetails called without department ID');
    return { department: null, error: 'Department ID is required' };
  }

  // Ensure departmentId is a string for consistent comparisons
  const deptId = String(departmentId);
  
  try {
    console.log(`Fetching details for department ${deptId}`);
    
    // First try the direct department endpoint
    try {
      const response = await api.get(`/department/${deptId}/`);
      if (response.data) {
        console.log(`Successfully got department details from direct endpoint:`, response.data);
        return { department: response.data, error: null };
      }
    } catch (directError) {
      console.log(`Couldn't fetch from direct endpoint, trying HOD endpoint next:`, directError.message);
      
      // If the direct endpoint fails, try the HOD specific endpoint
      try {
        const hodResponse = await api.get(`/hod/department/${deptId}/`);
        if (hodResponse.data) {
          console.log(`Successfully got department details from HOD endpoint:`, hodResponse.data);
          return { department: hodResponse.data, error: null };
        }
      } catch (hodError) {
        console.log(`HOD endpoint also failed:`, hodError.message);
        // Continue to the fallback approach if both direct and HOD specific endpoints fail
      }
    }
    
    // Fallback: Get all departments and find the specific one
    const response = await api.get('/department/');
    
    if (!response.data) {
      console.error('No department data received from API');
      throw new Error('No data received from API');
    }
    
    console.log(`Received ${response.data.length} departments from API`);
    
    // Find the specific department by ID using various formats
    // Some APIs return department_id, some return id, some use strings, some use numbers
    const department = response.data.find(dept => {
      // For debugging
      console.log(`Comparing department:`, {
        deptId: deptId,
        currentDeptId: dept.id,
        currentDeptIdType: typeof dept.id,
        match: String(dept.id) === deptId
      });
      
      // Try different field names and formats
      return String(dept.id) === deptId || 
             (dept.department_id && String(dept.department_id) === deptId) ||
             (dept.department_code && String(dept.department_code) === deptId);
    });
    
    if (!department) {
      console.warn(`Department with ID ${deptId} not found in ${response.data.length} departments`);
      
      // Log all department IDs to help with debugging
      console.log('Available department IDs:', response.data.map(d => d.id));
      
      // Try a fallback approach - if there's only one department, return it
      if (response.data.length === 1) {
        console.log('Only one department available, using it as fallback');
        return { department: response.data[0], error: null };
      }
      
      throw new Error(`Department with ID ${deptId} not found`);
    }
    
    console.log(`Found department:`, department);
    return { department, error: null };
    
  } catch (error) {
    console.error("Error fetching department details:", error);
    
    // Check if the error is due to a network issue or API availability
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      console.warn("Network issue detected, providing mock data");
      return { 
        department: {
          id: departmentId,
          department_name: "Department Name",
          department_code: "DEP-CODE",
          college: { id: 1, name: "College Name" },
          details: "Department description"
        }, 
        error: null 
      };
    }
    
    // Provide mock data if the endpoint returns 404
    if (error.response && error.response.status === 404) {
      console.log("Department endpoint not found, providing mock data");
      return { 
        department: {
          id: departmentId,
          department_name: "Department Name",
          department_code: "DEP-CODE",
          college: { id: 1, name: "College Name" },
          details: "Department description"
        }, 
        error: null 
      };
    }
    
    return { 
      department: null, 
      error: `Failed to fetch department details: ${error.message}`
    };
  }
};

// Keep track of API availability
const apiStatus = {
  isAvailable: true,
  lastChecked: 0,
  checkInterval: 60000, // 1 minute
};

// Function to check if API is available
const checkApiAvailability = async () => {
  // If we've checked recently, don't check again
  const now = Date.now();
  if (now - apiStatus.lastChecked < apiStatus.checkInterval) {
    return apiStatus.isAvailable;
  }

  try {
    // Try to make a simple request to the API
    await axios.get(`${API_URL}/health/`, { timeout: 3000 });
    apiStatus.isAvailable = true;
  } catch (error) {
    console.warn("API appears to be unavailable:", error.message);
    apiStatus.isAvailable = false;
  } finally {
    apiStatus.lastChecked = now;
  }
  
  return apiStatus.isAvailable;
};

// Get dashboard data based on user role
export const getDashboardData = async () => {
  try {
    // Check if API is available
    const isApiAvailable = await checkApiAvailability();
    if (!isApiAvailable) {
      console.log("API is unavailable, using mock dashboard data");
      return getDefaultDashboardData();
    }
    
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;

    if (!role) {
      console.warn("No user role found, using default dashboard data");
      return getDefaultDashboardData();
    }

    let dashboardData;
    
    // Try to get role-specific dashboard
    if (role === "STUDENT") {
      try {
        dashboardData = await getStudentDashboard();
      } catch (error) {
        console.log("Couldn't get student specific dashboard, using generic data");
        dashboardData = getDefaultDashboardData();
      }
    } else if (role === "LECTURER" || role === "HOD") {
      try {
        dashboardData = await getLecturerDashboard();
      } catch (error) {
        console.log("Couldn't get HOD specific dashboard, using generic data");
        dashboardData = getDefaultDashboardData();
      }
    } else if (role === "ADMIN") {
      try {
        dashboardData = await getAdminDashboard();
      } catch (error) {
        console.log("Couldn't get admin specific dashboard, using generic data");
        dashboardData = getDefaultDashboardData();
      }
    } else {
      // For any unknown role, return default dashboard data
      dashboardData = getDefaultDashboardData();
    }

    return dashboardData;
  } catch (error) {
    console.warn("Error fetching dashboard data:", error);
    return getDefaultDashboardData();
  }
};

// Helper function to get default dashboard data
const getDefaultDashboardData = () => {
  return {
    total_issues: 0,
    pending_issues: 0,
    in_progress_issues: 0,
    solved_issues: 0,
    recent_issues: [],
    issue_statistics: {
      pending: 0,
      in_progress: 0,
      solved: 0
    }
  };
};

/**
 * Marks an issue as solved
 * @param {number|string} issueId - The ID of the issue to mark as solved
 * @returns {Promise<Object>} Updated issue data
 */
export const markIssueAsSolved = async (issueId) => {
  if (!issueId) {
    throw new Error('Issue ID is required');
  }

  try {
    console.log(`Marking issue ${issueId} as solved`);
    
    // Prepare the update data
    const updateData = {
      status: 'Solved',
      resolution_date: new Date().toISOString()
    };
    
    // Send the update request
    const response = await api.patch(`/issues/${issueId}/`, updateData);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error marking issue ${issueId} as solved:`, error);
    throw error;
  }
};

/**
 * Fetches all issues assigned to a specific lecturer
 * @param {number|string} lecturerId - The ID of the lecturer
 * @returns {Promise<{issues: Array, error: string|null}>}
 */
export const getLecturerIssues = async (lecturerId) => {
  if (!lecturerId) {
    return { issues: [], error: 'Lecturer ID is required' };
  }

  try {
    console.log(`Fetching issues for lecturer ${lecturerId}`);
    
    // Fetch all issues from the API
    const response = await api.get("/issues/");
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    // Filter issues assigned to this lecturer
    const assignedIssues = response.data.filter(issue => {
      // Check if assigned_to is this lecturer
      return (
        (issue.assigned_to?.id === parseInt(lecturerId)) || 
        (issue.assigned_to === parseInt(lecturerId))
      );
    });
    
    console.log(`Found ${assignedIssues.length} issues assigned to lecturer ${lecturerId}`);
    return { issues: assignedIssues, error: null };
    
  } catch (error) {
    console.error("Error fetching lecturer issues:", error);
    return { 
      issues: [], 
      error: `Failed to fetch lecturer issues: ${error.message}`
    };
  }
};

// Helper function to wrap API calls with error handling
const safeApiCall = async (apiFunction, defaultValue, ...args) => {
  try {
    return await apiFunction(...args);
  } catch (error) {
    console.error(`API call failed: ${error.message}`);
    return defaultValue;
  }
};

export default api;
