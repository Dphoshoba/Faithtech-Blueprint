import React from 'react';
import {
  FaUsers,
  FaCalendarAlt,
  FaHandshake,
  FaChartLine,
  FaMobileAlt,
  FaLock,
} from 'react-icons/fa';

type Feature = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const features: Feature[] = [
  {
    name: 'Member Management',
    description:
      'Easily manage your church members, track attendance, and maintain contact information in one centralized system.',
    icon: FaUsers,
  },
  {
    name: 'Event Scheduling',
    description:
      'Streamline your church calendar with an intuitive scheduling system for services, meetings, and special events.',
    icon: FaCalendarAlt,
  },
  {
    name: 'Volunteer Coordination',
    description:
      'Coordinate volunteers, manage schedules, and ensure smooth operations for all church activities.',
    icon: FaHandshake,
  },
  {
    name: 'Growth Analytics',
    description:
      'Track attendance, giving, and engagement metrics to measure your ministry\'s impact and identify growth opportunities.',
    icon: FaChartLine,
  },
  {
    name: 'Mobile App',
    description:
      'Stay connected with your church community through our mobile app, available for both iOS and Android devices.',
    icon: FaMobileAlt,
  },
  {
    name: 'Secure Platform',
    description:
      'Rest easy knowing your church\'s data is protected with enterprise-grade security and regular backups.',
    icon: FaLock,
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything You Need to Manage Your Church
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Powerful features designed specifically for churches
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-2 text-base text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#pricing"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View Pricing
            <svg
              className="ml-2 -mr-1 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
