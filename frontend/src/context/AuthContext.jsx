import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// We don't need to set baseURL when using proxy in package.json
// axios.defaults.baseURL = 'http://localhost:5001';

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
      console.log('Token from localStorage:', token ? 'Found' : 'Not found');
      
      if (!token) {
        console.log('No token found, user is not authenticated');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('Setting Authorization header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        console.log('Making request to /api/auth/me endpoint');
        const response = await axios.get('/api/auth/me');
        
        // Log the full response for debugging
        console.log('Auth check response data:', response.data);
        
        if (!response.data) {
          console.error('Empty response data from /api/auth/me');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          throw new Error('Invalid user data received');
        }
        
        if (!response.data.role) {
          console.error('User data missing role:', response.data);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
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
      setLoading(true); // Set loading to true during login attempt
      
      // Ensure base URL is correctly set
      console.log('AuthContext: Using baseURL:', axios.defaults.baseURL);
      const loginEndpoint = '/api/auth/login';
      console.log('AuthContext: Posting to:', loginEndpoint);
      
      const response = await axios.post(loginEndpoint, { email, password });
      
      // Log the full response for debugging
      console.log('AuthContext: Login response:', response.data);
      
      if (!response.data) {
        console.error('AuthContext: Empty response data');
        throw new Error('Empty response from server');
      }
      
      if (!response.data.token || !response.data.user) {
        console.error('AuthContext: Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
      
      const { token, user } = response.data;
      
      // Verify that user has a valid role
      if (!user.role) {
        console.error('AuthContext: User missing role:', user);
        throw new Error('Account role is missing. Please contact administrator.');
      }
      
      // Verify that role is one of the valid roles
      const validRoles = ['student', 'doctor', 'receptionist', 'drugstore_manager'];
      if (!validRoles.includes(user.role)) {
        console.error('AuthContext: Invalid user role:', user.role);
        throw new Error('Invalid account role. Please contact administrator.');
      }
      
      // Store token and update state
      console.log('AuthContext: Storing token and updating user state', user);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return user;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      if (error.response) {
        console.error('AuthContext: Response status:', error.response.status);
        console.error('AuthContext: Response data:', error.response.data);
      } else if (error.request) {
        console.error('AuthContext: No response received:', error.request);
      }
      throw error;
    } finally {
      setLoading(false); // Always set loading to false when done
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }; 