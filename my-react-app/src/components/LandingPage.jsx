// src/components/LandingPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faSuitcaseMedical,
  faBusinessTime,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import {
  faSquareFacebook,
  faInstagram,
  faTwitterSquare,
} from "@fortawesome/free-brands-svg-icons";

import Navbar from "./Navbar.jsx";
import FlipCard from "./FlipCard.jsx";
import InfiniteScroll from "./InfiniteScroll.jsx";
import ScrollProgress from "./ScrollProgress.jsx";
import FadeInSection from "./FadeInSection.jsx";
import { detectMobileDevice } from '../utils/viewportDetection';

import Percentages from "../assets/images/Percentages-removebg-preview.png";
import "../styles/LandingPageStyle.css";

// Add constant for content types to match AdminPage
const CONTENT_TYPES = {
  HOMEPAGE_BANNER: 'homepage_banner',
  ABOUT_US: 'about_us',
  CONTACT_INFO: 'contact_info',
};

const INITIAL_CONTENT_DATA = {
  [CONTENT_TYPES.HOMEPAGE_BANNER]: {
    title: 'Urgent Need for O- Donors',
    description: 'We are currently experiencing a shortage of O- blood type. Please consider donating if you are eligible.',
    lastModified: new Date().toISOString(),
    status: 'published',
  },
  [CONTENT_TYPES.ABOUT_US]: {
    title: 'About Us',
    description: 'At RedHope we are dedicated to bridging the gap between blood donors and those in need. Our mission is to save lives by making blood donation easier and more accessible for everyone. We believe that every drop counts, and together, we can make a difference.',
    lastModified: new Date().toISOString(),
    status: 'published',
  },
  [CONTENT_TYPES.CONTACT_INFO]: {
    title: 'Contact Info',
    description: 'Address: 123 Main St, Algiers\nPhone: +213 123 456 789\nEmail: contact@redhope.dz',
    lastModified: new Date().toISOString(),
    status: 'published',
  },
};

export default function LandingPage() {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );
  
  // Add state for content data
  const [contentData, setContentData] = useState(
    JSON.parse(localStorage.getItem('redhope_content_data')) || INITIAL_CONTENT_DATA
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem("language") || "en";
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  useEffect(() => {
    const toggle = document.getElementById("toggle");
    const handleThemeChange = () => {
      document.body.classList.toggle("dark-theme", toggle.checked);
    };
    toggle.addEventListener("change", handleThemeChange);
    return () => toggle.removeEventListener("change", handleThemeChange);
  }, []);

  // Add effect to check for content updates
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedContent = localStorage.getItem('redhope_content_data');
      if (updatedContent) {
        try {
          setContentData(JSON.parse(updatedContent));
        } catch (err) {
          console.error('Error parsing content data:', err);
        }
      }
    };

    // Listen for storage events (in case admin updates content in another tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Check for content updates periodically
    const interval = setInterval(handleStorageChange, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Initialize viewport detection
    detectMobileDevice();
    
    // ...rest of your existing effects...
  }, []);

  return (
    <>
      <ScrollProgress />
      <div className="homepage">
        <Navbar />

        <div id="home" className="section-anchor"></div>

        <FadeInSection className="Container_01">
          <img src={Percentages} className="img_undraw_medicine" alt="Data Trends" />
          <div>
            <h1>
              {language === "fr"
                ? "Trouvez des donneurs près de chez vous 24/7"
                : "Find Donors Near You 24/7"}
            </h1>
            <p>
              {language === "fr"
                ? "Notre plateforme vous aide à trouver des donneurs de sang à proximité à tout moment. Que vous ayez un besoin urgent ou que vous planifiez un don futur, nous vous mettons en relation avec des donneurs disponibles près de chez vous pour un soutien rapide."
                : "Our platform helps you locate blood donors nearby anytime. Whether you're in urgent need or planning for a future donation, we connect you with available donors near your location for timely support."}
            </p>
          </div>
        </FadeInSection>

        <FadeInSection className="heartbeat">
          <InfiniteScroll />
        </FadeInSection>

        <FadeInSection className="Container_02">
          <div className="stat">
            <h1>50+</h1>
            <p>{language === "fr" ? "Donneurs à proximité" : "Donors Nearby"}</p>
          </div>
          <div className="stat">
            <h1>100+</h1>
            <p>{language === "fr" ? "Dons réussis" : "Successful Donations"}</p>
          </div>
          <div className="stat">
            <h1>10+</h1>
            <p>{language === "fr" ? "Campagnes locales de dons" : "Local Donation Drives"}</p>
          </div>
        </FadeInSection>

        <FadeInSection className="Container_03">
          <h1>
            {language === "fr"
              ? "4 étapes simples pour trouver des donneurs"
              : "4 Easy Steps To Find Donors"}
          </h1>
          <div className="flex_Container_03">
            {[
              {
                icon: faMagnifyingGlass,
                titleEn: "Search for Donors",
                titleFr: "Recherchez des donneurs",
                descEn:
                  "Use our platform to search for blood donors near your location. We make it easy to find compatible donors in real-time, ensuring quick and efficient support when you need it most.",
                descFr:
                  "Utilisez notre plateforme pour rechercher des donneurs de sang à proximité. Nous facilitons la recherche de donneurs compatibles en temps réel pour un soutien rapide.",
              },
              {
                icon: faSuitcaseMedical,
                titleEn: "Check Donor Profiles",
                titleFr: "Vérifiez les profils des donneurs",
                descEn:
                  "Review detailed profiles of potential donors, including blood type, donation history, and availability, to find the best match for your needs.",
                descFr:
                  "Consultez les profils détaillés des donneurs potentiels, incluant le groupe sanguin, l'historique de dons et la disponibilité, pour trouver la meilleure correspondance.",
              },
              {
                icon: faBusinessTime,
                titleEn: "Schedule a Donation",
                titleFr: "Planifiez un don",
                descEn:
                  "Quickly schedule a blood donation at a time and place convenient for both you and the donor. Our scheduling feature ensures a seamless donation process.",
                descFr:
                  "Planifiez rapidement un don de sang à un moment et dans un lieu qui conviennent à la fois au donneur et à vous. Notre fonctionnalité de planification assure un processus de don fluide.",
              },
              {
                icon: faHeart,
                titleEn: "Save Lives",
                titleFr: "Sauvez des vies",
                descEn:
                  "Every successful donation helps save lives. By connecting with nearby donors, you're making a difference in your community and beyond.",
                descFr:
                  "Chaque don réussi contribue à sauver des vies. En vous connectant avec des donneurs à proximité, vous faites une différence dans votre communauté et au-delà.",
              },
            ].map((step, i) => (
              <div className="card" key={i}>
                <h1>
                  <FontAwesomeIcon icon={step.icon} style={{ color: "#ff4747" }} />
                </h1>
                <h2>{language === "fr" ? step.titleFr : step.titleEn}</h2>
                <p>{language === "fr" ? step.descFr : step.descEn}</p>
              </div>
            ))}
          </div>
        </FadeInSection>

        <div id="services" className="section-anchor"></div>
        <FadeInSection className="Container_04">
          <h1>{language === "fr" ? "Nos Services" : "Our Services"}</h1>
          <div className="grid_Container_04">
            {[
              {
                titleEn: "Blood Donation Drives",
                titleFr: "Campagnes de don de sang",
                descEn: "We organize regular blood donation drives to help ensure a steady supply of blood for those in need.",
                descFr: "Nous organisons régulièrement des campagnes de don de sang pour garantir un approvisionnement constant en sang pour ceux dans le besoin.",
              },
              {
                titleEn: "Donor Matching",
                titleFr: "Appariement des donneurs",
                descEn: "We provide advanced matching algorithms to connect patients with suitable blood donors based on compatibility.",
                descFr: "Nous proposons des algorithmes avancés pour connecter les patients aux donneurs compatibles, selon leur groupe sanguin et leurs disponibilités.",
              },
              {
                titleEn: "Emergency Services",
                titleFr: "Services d’urgence",
                descEn: "Our platform is available 24/7 for emergencies, ensuring that blood is always accessible when needed.",
                descFr: "Notre plateforme est disponible 24h/24 et 7j/7 en cas d'urgence, assurant ainsi l'accès au sang quand vous en avez besoin.",
              },
            ].map((service, i) => (
              <div key={i}>
                <h2>{language === "fr" ? service.titleFr : service.titleEn}</h2>
                <p>{language === "fr" ? service.descFr : service.descEn}</p>
              </div>
            ))}
          </div>
        </FadeInSection>

        <div id="about" className="section-anchor"></div>
        <FadeInSection className="Container_05">
          <h1>
            <span>{language === "fr" ? "À propos" : "About"}</span>{" "}
            {language === "fr" ? "Nous" : "Us"}
          </h1>
          <div>
            <div className="about-content">
              <p>
                {language === "fr"
                  ? contentData[CONTENT_TYPES.ABOUT_US].description
                  : contentData[CONTENT_TYPES.ABOUT_US].description}
              </p>
            </div>
            <div className="flip-card-container">
              <FlipCard />
            </div>
          </div>
        </FadeInSection>

        <FadeInSection className="footer">
          <div className="grid_footer">
            <div>
              <h1>RedHope</h1>
              <p>
                {language === "fr"
                  ? "Accompagner votre parcours santé à chaque étape"
                  : "Empowering Your Health Journey Every Step of the Way"}
              </p>
            </div>
            <div className="flex_footer">
              {[faSquareFacebook, faInstagram, faTwitterSquare].map((icon, i) => (
                <p key={i}>
                  <FontAwesomeIcon icon={icon} style={{ color: "#ffffff" }} size="2x" />
                </p>
              ))}
            </div>
          </div>
        </FadeInSection>

        <FadeInSection className="rights">
          {language === "fr"
            ? `-- @ ${new Date().getFullYear()} Insove - Tous droits réservés --`
            : `-- @ ${new Date().getFullYear()} Insove - All rights reserved --`}
        </FadeInSection>
      </div>
    </>
  );
}