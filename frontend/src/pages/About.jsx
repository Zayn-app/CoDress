import React from 'react';
import cocoImg from '../assets/about-coco.jpg';
import './About.css';

function About() {
  return (
    <div className="about-hero-outer">
      <div className="about-hero-content">
        <div className="about-hero-text">
          <h1>Hakkımızda</h1>
          <p>
            CoDress, modayı herkes için erişilebilir ve sürdürülebilir kılmak amacıyla kurulmuş bir platformdur. Amacımız, kullanıcılarımıza yüksek stil ve uygun fiyatı bir arada sunmak, aynı zamanda bilinçli tüketimi ve sürdürülebilir modayı teşvik etmektir.<br /><br />
            Kendi gardırobunuzu oluşturun, kombin önerileri alın ve modanın keyfini çıkarın!
          </p>
        </div>
        <div className="about-hero-img">
          <img src={cocoImg} alt="Coco Chanel" />
        </div>
      </div>
    </div>
  );
}

export default About; 