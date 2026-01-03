import axios from 'axios';

const API_URL =
  process.env.REACT_APP_USER_SERVICE_URL ||
  'http://localhost:8092/api/utilisateurs';  // Corrigé : port 8092

class UserService {

  // 🔐 Token JWT
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ❌ Gestion d’erreurs (même logique que RecipesService)
  handleError(error) {
    if (error.response) {
      console.error('[UserService] HTTP error', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data
      });
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        'Une erreur est survenue';
      throw new Error(message);
    } else if (error.request) {
      console.error('[UserService] No response');
      throw new Error('Impossible de contacter le serveur');
    } else {
      console.error('[UserService] Error', error);
      throw new Error(error.message);
    }
  }

  // =========================
  // PROFIL
  // =========================
  async getProfile() {
    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${API_URL}/me`, profileData, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // =========================
  // PRÉFÉRENCES
  // =========================
  async getPreferences() {
    try {
      const response = await axios.get(`${API_URL}/me/preferences`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePreferences(preferences) {
    try {
      const response = await axios.put(
        `${API_URL}/me/preferences`,
        preferences,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // =========================
  // COMPTE
  // =========================

  async deleteAccount() {
    try {
      await axios.delete(`${API_URL}/me`, {
        headers: this.getAuthHeader()
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async exportUserData() {
    try {
      const response = await axios.get(
        `${API_URL}/me/export`,
        {
          headers: this.getAuthHeader(),
          responseType: 'blob' // IMPORTANT
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

}

const userService = new UserService();
export default userService;