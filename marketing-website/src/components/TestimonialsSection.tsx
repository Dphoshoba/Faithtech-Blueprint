import React from 'react';
import Image from 'next/image';

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  church: string;
  image: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      'Faithtech has transformed how we manage our church. The member management system is intuitive, and the volunteer scheduling has saved us countless hours.',
    author: 'Sarah Johnson',
    role: 'Church Administrator',
    church: 'Grace Community Church',
    image: '/testimonials/sarah.jpg',
  },
  {
    quote:
      'The analytics features have given us valuable insights into our ministry's growth. We can now make data-driven decisions to better serve our community.',
    author: 'Michael Chen',
    role: 'Lead Pastor',
    church: 'New Life Fellowship',
    image: '/testimonials/michael.jpg',
  },
  {
    quote:
      'Our volunteers love the mobile app. It's made coordinating Sunday services and special events so much easier. The platform is truly a game-changer.',
    author: 'David Rodriguez',
    role: 'Volunteer Coordinator',
    church: 'Hope Community Church',
    image: '/testimonials/david.jpg',
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Trusted by Churches Worldwide
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            See what other church leaders are saying about Faithtech
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.author}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {testimonial.author}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.church}</p>
                  </div>
                </div>
                <blockquote className="mt-4">
                  <p className="text-gray-600 italic">"{testimonial.quote}"</p>
                </blockquote>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a
            href="#contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Join These Churches
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

export default TestimonialsSection; 