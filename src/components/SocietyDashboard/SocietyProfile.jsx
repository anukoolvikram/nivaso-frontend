import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import LoadingSpinner from '../LoadingSpinner'

const SocietyProfile = () => {
  const [society, setSociety] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token=localStorage.getItem('token')
  const decoded = token ? jwtDecode(token) : null;
//   console.log(decoded)
  const society_id = decoded?.id;

  useEffect(() => {
    const fetchSociety = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/society/profile/${society_id}`)
        console.log(data)
        setSociety(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load society details.')
      } finally {
        setLoading(false)
      }
    }

    fetchSociety()
  }, [society_id])

  if (loading) {
    return (
      <LoadingSpinner/>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    )
  }

  if (!society) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
        No society found.
      </div>
    )
  }

  return (
    <div className="max-w-lg bg-white shadow-md rounded-md p-6">
      <div className="text-2xl font-semibold mb-4">
        {society.society_name} 
      </div>

      <div className="space-y-2 text-gray-800">
        <div>
          <span className="font-medium">Society Code:</span> {society.society_code}
        </div>
        {society.federation_code!='FED17032025' 
            ?<div>
                <span className="font-medium">Federation Code:</span> {society.federation_code}
            </div>
            : <></>
        }
        <div>
          <span className="font-medium">Type:</span> {society.society_type}
        </div>

        <div>
          <span className="font-medium">Wings:</span> {society.no_of_wings}
        </div>
        <div>
          <span className="font-medium">Floors per Wing:</span> {society.floor_per_wing}
        </div>
        <div>
          <span className="font-medium">Rooms per Floor:</span> {society.rooms_per_floor}
        </div>
        <div>
          <span className="font-medium">Contact Email:</span> {society.email}
        </div>
      </div>
    </div>
  )
}

export default SocietyProfile