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

import Percentages from "../assets/images/Percentages-removebg-preview.png";
import "../styles/LandingPageStyle.css";

export default function LandingPage() {
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
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
                ? "Notre plateforme vous aide à trouver des donneurs de sang à proximité à tout moment..."
                : "Our platform helps you locate blood donors nearby anytime..."}
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
                  "Use our platform to search for blood donors near your location...",
                descFr:
                  "Utilisez notre plateforme pour rechercher des donneurs de sang à proximité...",
              },
              {
                icon: faSuitcaseMedical,
                titleEn: "Check Donor Profiles",
                titleFr: "Vérifiez les profils des donneurs",
                descEn:
                  "Review detailed profiles of potential donors, including blood type...",
                descFr:
                  "Consultez les profils détaillés des donneurs potentiels...",
              },
              {
                icon: faBusinessTime,
                titleEn: "Schedule a Donation",
                titleFr: "Planifiez un don",
                descEn:
                  "Quickly schedule a blood donation at a time and place convenient...",
                descFr:
                  "Planifiez rapidement un don de sang à un moment et dans un lieu...",
              },
              {
                icon: faHeart,
                titleEn: "Save Lives",
                titleFr: "Sauvez des vies",
                descEn:
                  "Every successful donation helps save lives...",
                descFr:
                  "Chaque don réussi contribue à sauver des vies...",
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
                descEn: "We organize regular blood donation drives...",
                descFr: "Nous organisons régulièrement des campagnes de don de sang...",
              },
              {
                titleEn: "Donor Matching",
                titleFr: "Appariement des donneurs",
                descEn: "We provide advanced matching algorithms...",
                descFr: "Nous proposons des algorithmes avancés...",
              },
              {
                titleEn: "Emergency Services",
                titleFr: "Services d’urgence",
                descEn: "Our platform is available 24/7 for emergencies...",
                descFr: "Notre plateforme est disponible 24h/24 et 7j/7...",
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
                  ? "Chez RedHope, nous nous engageons à combler le fossé entre les donneurs..."
                  : "At RedHope we are dedicated to bridging the gap between blood donors..."}
              </p>
            </div>
            <div className="flip-card-container">
              <FlipCard />
            </div>
          </div>
        </FadeInSection>

        <FadeInSection className="footer">
          <div className="grid_footer">
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