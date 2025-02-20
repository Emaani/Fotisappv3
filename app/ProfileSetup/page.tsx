"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  country?: string;
  currency: string;
  profilePicture?: File | null;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc' },
  { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
];

export default function ProfileSetup() {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    currency: 'USD',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null
    }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Enhanced validation with detailed error messages
      const requiredFields = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        currency: formData.currency
      };

      const emptyFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        setError(`Please fill in the following required fields: ${emptyFields.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Create FormData object
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString().trim());
        }
      });

      // Log the data being sent
      console.log('Sending form data:', Object.fromEntries(formDataToSend.entries()));

      const response = await axios.post('/api/profile/setup', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        sessionStorage.setItem("isAuthenticated", "true");
        router.push('/TradeCommodities');
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900">Complete Your Profile</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32">
                {previewUrl ? (
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Profile preview"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
                id="profile-picture"
              />
              <label
                htmlFor="profile-picture"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {previewUrl ? 'Change Photo' : 'Upload Photo'}
              </label>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                  text-gray-900 text-base
                  hover:border-gray-400 transition-colors"
              />
              {formData.firstName && (
                <p className="mt-1 text-sm text-gray-600">
                  Entered: {formData.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                  text-gray-900 text-base
                  hover:border-gray-400 transition-colors"
              />
              {formData.lastName && (
                <p className="mt-1 text-sm text-gray-600">
                  Entered: {formData.lastName}
                </p>
              )}
            </div>

            {formData.firstName && formData.lastName && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Full Name Preview:</p>
                <p className="text-base text-gray-900">{`${formData.firstName} ${formData.lastName}`}</p>
              </div>
            )}

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                  text-gray-900 text-base
                  hover:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                  text-gray-900 text-base
                  hover:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-bold text-gray-700 mb-2">
                Preferred Currency *
              </label>
              <div className="relative">
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {SUPPORTED_CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                shadow-sm text-sm font-medium text-white bg-blue-600 
                hover:bg-blue-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-blue-500 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Complete Profile Setup'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}