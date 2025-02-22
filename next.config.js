/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "creeklandsconservation.s3.us-west-1.amazonaws.com",
        pathname: "/**", // Allows all images from this S3 bucket
      },
      {
        protocol: "https",
        hostname: "creeklands.org",
        pathname: "/wp-content/uploads/**", // Allows images from WordPress uploads
      },
    ],
  },
};

module.exports = {
  images: {
    domains: ["creeklandsconservation.s3.us-west-1.amazonaws.com"],
  },
  // ...other Next.js config options
};
