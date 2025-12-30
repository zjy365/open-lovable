"use client";

import { motion } from "motion/react";
import { HTMLAttributes } from "react";

export default function AnimatedSealosLogo({
  className = "",
  ...attrs
}: HTMLAttributes<HTMLOrSVGElement>) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      whileHover={{
        scale: 1.1,
        rotate: [0, -5, 5, -5, 0],
        transition: {
          rotate: {
            duration: 0.5,
            ease: "easeInOut",
          },
          scale: {
            duration: 0.2,
          },
        },
      }}
      {...attrs}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full blur-lg opacity-0"
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.3 }}
        style={{
          background:
            "radial-gradient(circle, rgba(10, 163, 249, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Main logo SVG */}
      <motion.svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        whileHover={{
          filter: [
            "brightness(1)",
            "brightness(1.2)",
            "brightness(1)",
          ],
        }}
        transition={{
          filter: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        {/* Animated gradients */}
        <defs>
          <motion.linearGradient
            id="paint0_linear_animated"
            x1="9.13474"
            y1="1.02182"
            x2="-1.24364"
            y2="17.377"
            gradientUnits="userSpaceOnUse"
            animate={{
              x1: [9.13474, 11, 9.13474],
              y1: [1.02182, -1, 1.02182],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <stop stopColor="#0AA3F9" />
            <stop offset="1" stopColor="#B5B4FF" />
          </motion.linearGradient>

          <motion.linearGradient
            id="paint1_linear_animated"
            x1="30.0478"
            y1="26.0845"
            x2="13.5507"
            y2="4.86078"
            gradientUnits="userSpaceOnUse"
            animate={{
              x1: [30.0478, 32, 30.0478],
              y1: [26.0845, 28, 26.0845],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <stop stopColor="#0AA3F9" />
            <stop offset="1" stopColor="#B5B4FF" />
          </motion.linearGradient>

          <linearGradient
            id="paint2_linear_animated"
            x1="20.2617"
            y1="1.47918"
            x2="1.33704"
            y2="19.4423"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7ABBFD" />
            <stop offset="1" stopColor="#7ABBFD" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Left flame part with entrance animation */}
        <motion.path
          d="M6.06448 13.1649C7.65965 15.4971 10.9662 15.2813 10.9662 15.2813C10.1462 14.4829 9.60673 13.7492 9.54199 11.676C9.47725 9.60273 8.312 9.04168 8.312 9.04168C10.4367 7.71043 9.67146 6.25635 9.60673 4.64292C9.56689 3.64531 10.1628 2.89503 10.6243 2.47009C5.52667 3.22203 1.61426 7.61416 1.61426 12.9209C1.61426 13.296 1.65409 13.6463 1.69227 14.0115C1.88814 13.4886 4.59048 11.0087 6.06614 13.1649H6.06448Z"
          fill="url(#paint0_linear_animated)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1, ease: "easeInOut" },
            opacity: { duration: 0.5 },
          }}
        />

        {/* Right main part with entrance animation */}
        <motion.path
          d="M24.1248 6.83106C22.9977 5.88159 21.7877 5.63593 20.8565 5.63593C18.189 5.63593 15.9398 7.81041 15.8103 10.4746C15.8037 10.5941 15.8037 10.6804 15.8037 10.7816C15.8037 10.9626 15.8203 11.1584 15.8336 11.3128C15.8585 11.5801 15.9498 12.0083 16.0145 12.3818C16.0925 12.835 16.1257 13.0756 16.1423 13.5471C16.1573 14.0152 16.1141 14.5181 16.0676 14.8285C15.9962 15.3132 15.8452 15.8975 15.6692 16.3424C15.143 17.6769 14.2799 18.7924 13.181 19.5974C12.0042 20.4606 10.5484 20.9868 8.91838 20.9868C7.73984 20.9868 6.6609 20.7146 5.68819 20.2265C3.68136 19.2173 2.24222 17.3549 1.79736 15.0294C2.67546 20.9768 7.87098 25.5283 14.0624 25.5283C20.8697 25.5283 26.3889 20.0091 26.3889 13.2018C26.3889 12.2291 26.281 11.356 26.13 10.6157C26.0171 10.0629 25.8362 9.44044 25.5723 8.82627C25.232 8.0345 24.7954 7.39709 24.1248 6.83106Z"
          fill="url(#paint1_linear_animated)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.2, ease: "easeInOut", delay: 0.2 },
            opacity: { duration: 0.5, delay: 0.2 },
          }}
        />

        {/* Mask group */}
        <mask
          id="mask0_animated"
          style={{ maskType: "luminance" }}
          maskUnits="userSpaceOnUse"
          x="1"
          y="5"
          width="26"
          height="21"
        >
          <path
            d="M24.1248 6.83106C22.9977 5.88159 21.7877 5.63593 20.8565 5.63593C18.189 5.63593 15.9398 7.81041 15.8103 10.4746C15.8037 10.5941 15.8037 10.6804 15.8037 10.7816C15.8037 10.9626 15.8203 11.1584 15.8336 11.3128C15.8585 11.5801 15.9498 12.0083 16.0145 12.3818C16.0925 12.835 16.1257 13.0756 16.1423 13.5471C16.1573 14.0152 16.1141 14.5181 16.0676 14.8285C15.9962 15.3132 15.8452 15.8975 15.6692 16.3424C15.143 17.6769 14.2799 18.7924 13.181 19.5974C12.0042 20.4606 10.5484 20.9868 8.91838 20.9868C7.73984 20.9868 6.6609 20.7146 5.68819 20.2265C3.68136 19.2173 2.24222 17.3549 1.79736 15.0294C2.67546 20.9768 7.87098 25.5283 14.0624 25.5283C20.8697 25.5283 26.3889 20.0091 26.3889 13.2018C26.3889 12.2291 26.281 11.356 26.13 10.6157C26.0171 10.0629 25.8362 9.44044 25.5723 8.82627C25.232 8.0345 24.7954 7.39709 24.1248 6.83106Z"
            fill="white"
          />
        </mask>

        {/* Center highlight with pulse animation */}
        <g mask="url(#mask0_animated)">
          <motion.path
            d="M12.7268 23.1987C18.726 23.1987 23.5893 18.3354 23.5893 12.3362C23.5893 6.33704 18.726 1.47375 12.7268 1.47375C6.72767 1.47375 1.86438 6.33704 1.86438 12.3362C1.86438 18.3354 6.72767 23.1987 12.7268 23.1987Z"
            fill="url(#paint2_linear_animated)"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </g>
      </motion.svg>

      {/* Sparkle effects */}
      <motion.div
        className="absolute top-0 right-0 w-1 h-1 bg-blue-400 rounded-full"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute bottom-1 left-1 w-1 h-1 bg-purple-400 rounded-full"
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1,
        }}
      />
    </motion.div>
  );
}
