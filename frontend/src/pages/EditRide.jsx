import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NoticeModal } from '../components/ThemeModals';

const EditRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    departureTime: '',
    availableSeats: '',
    pricePerSeat: ''
  });

  useEffect(() => {
    fetchRide();
  }, []);

  const fetchRide = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:5001/api/rides/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching ride', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5001/api/rides/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotice({
        variant: 'success',
        title: 'Ride updated',
        message: 'Your changes were saved.',
        navigateTo: '/my-rides',
      });
    } catch (error) {
      setNotice({ variant: 'error', message: 'Could not update this ride. Check your details and try again.' });
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <NoticeModal
        open={notice != null}
        title={notice?.title}
        message={notice?.message ?? ''}
        variant={notice?.variant ?? 'info'}
        onClose={() => {
          const to = notice?.navigateTo;
          setNotice(null);
          if (to) navigate(to);
        }}
      />
      <h1 className="text-2xl font-bold mb-4">Edit Ride</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="source" placeholder="Source" value={formData.source} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="text" name="destination" placeholder="Destination" value={formData.destination} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="datetime-local" name="departureTime" value={formData.departureTime} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="number" name="availableSeats" placeholder="Available Seats" value={formData.availableSeats} onChange={handleChange} className="w-full p-2 border rounded" required />
        <input type="number" name="pricePerSeat" placeholder="Price per Seat" value={formData.pricePerSeat} onChange={handleChange} className="w-full p-2 border rounded" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Update Ride</button>
      </form>
    </div>
  );
};

export default EditRide;