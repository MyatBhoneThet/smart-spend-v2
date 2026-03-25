import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { setStoredToken } from '../../utils/authSession';

const GitHubCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      console.error('GitHub auth failed: no code');
      navigate('/login');
      return;
    }

    const authenticate = async () => {
      try {
        const res = await axiosInstance.post(
          API_PATHS.AUTH.GITHUB,
          { code }
        );

        setStoredToken(res.data.token);
        navigate('/dashboard');
      } catch (err) {
        console.error('GitHub auth failed:', err);
        navigate('/login');
      }
    };

    authenticate();
  }, [navigate]);

  return <p>Signing in with GitHub…</p>;
};

export default GitHubCallback;
