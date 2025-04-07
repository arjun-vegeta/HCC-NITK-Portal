import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults - CRA approach only
// Use process.env.REACT_APP_* variables for Create React App
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
axios.defaults.baseURL = apiUrl;
console.log('Using API URL:', axios.defaults.baseURL);

// Clear any existing interceptors
axios.interceptors.request.eject(axios.interceptors.request.handlers?.[0]?.id);
axios.interceptors.response.eject(axios.interceptors.response.handlers?.[0]?.id);

// Set up axios interceptors for handling unauthorized errors
axios.interceptors.response.use(
  response => response,
  error => {
    // If we get a 401 error, log it but don't clear token yet
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized request detected by interceptor');
      console.log('Request URL:', error.config.url);
      console.log('Request headers:', JSON.stringify(error.config.headers));
      
      // For now, DON'T clear the token to help debug the issue
      // localStorage.removeItem('token');
      // delete axios.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

// Add request interceptor to add token to all requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      
      // Clean the token first
      const cleanToken = token.trim();
      
      // Set authorization header directly with proper space after "Bearer"
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log(`Adding auth token to request: ${config.url} (token length: ${cleanToken.length})`);
    } else {
      console.log(`No token available for request: ${config.url}`);
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAsync = async () => {
      await checkAuth();
    };
    
    checkAuthAsync();
  }, []);

  const checkAuth = async () => {
    console.log('Checking authentication status...');
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? `Found (length: ${token.length})` : 'Not found');
      
      if (!token) {
        console.log('No token found, user is not authenticated');
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Clean the token and set the header
      const cleanToken = token.trim();
      console.log('Clean token length:', cleanToken.length);
      
      // Explicitly set the default Authorization header with proper formatting
      axios.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
      console.log('Set axios default Authorization header with token from localStorage');
      
      // Make a request to /api/auth/me endpoint with explicit headers to guarantee format
      try {
        console.log('Making request to /api/auth/me endpoint with token');
        const response = await axios.get('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${cleanToken}`
          }
        });
        
        // Log the full response for debugging
        console.log('Auth check response data:', response.data);
        
        if (!response.data) {
          console.error('Empty response data from /api/auth/me');
          throw new Error('Invalid user data received');
        }
        
        if (!response.data.role) {
          console.error('User data missing role:', response.data);
          throw new Error('User data missing role');
        }
        
        console.log('Auth check successful, setting user data with role:', response.data.role);
        setUser(response.data);
      } catch (apiError) {
        console.error('API error during auth check:', apiError);
        if (apiError.response) {
          console.error('Error response data:', apiError.response.data);
          console.error('Error response status:', apiError.response.status);
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      console.log('Auth check complete, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Login attempt for:', email);
      console.log('AuthContext: baseURL configured as:', axios.defaults.baseURL);
      setLoading(true); // Set loading to true during login attempt
      
      console.log('AuthContext: About to make POST request to /api/auth/login');
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('AuthContext: Login response status:', response.status);
      console.log('AuthContext: Login response data:', response.data);
      
      if (!response.data || !response.data.token || !response.data.user) {
        console.error('AuthContext: Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
      
      if (!response.data.user.role) {
        console.error('AuthContext: User role missing in response:', response.data.user);
        throw new Error('User role missing in server response');
      }
      
      const { token, user } = response.data;
      
      // Clean the token before storing
      const cleanToken = token.trim();
      
      // Store token and update state
      console.log('AuthContext: Storing token of length:', cleanToken.length);
      localStorage.setItem('token', cleanToken);
      
      // Explicitly set the default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${cleanToken}`;
      console.log('AuthContext: Set axios default Authorization header');
      
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      if (error.response) {
        console.error('AuthContext: Response status:', error.response.status);
        console.error('AuthContext: Response data:', error.response.data);
      } else if (error.request) {
        console.error('AuthContext: No response received, request was:', error.request);
      } else {
        console.error('AuthContext: Error setting up request:', error.message);
      }
      throw error;
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    
    // Optionally force redirect to login
    // window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 