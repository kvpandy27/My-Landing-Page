'use client';

import "./globals.css";

import { useState } from 'react';
import { useEffect} from 'react';
import Image from 'next/image';

import Chat from "./chatbot"

export default function Home() {
  // getting workspace sieze
  const [workspace, setWorkspace] = useState(0);

  useEffect(() => {
    // Now we're in the browser!
    setWorkspace(window.innerWidth);

    const handleResize = () => setWorkspace(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // to sense button clicks
  const [isMenue, setIsMenuOpen] = useState(false);
  const [isSearch, setIsSearchOpen] = useState(false);

  //to sense the active media size
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900); // You can change 768 to any breakpoint
    };

    // Check on initial load
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  //to hide the navigation bar on scroll
  const [hideNav, setHideNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setHideNav(currentY > lastScrollY && currentY > 50);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  return (
    <div>
      {/* navigation container */}
      <div>
        <div className = {`nav ${hideNav ? 'nav--hidden' : ''}`}>
          <header className="header" style={{width: workspace-80}}>
            <div className="left">
              {isMobile && (
                <>
                  <div className="btncon">
                    <button onClick={() => setIsMenuOpen(prev => !prev)}>
                      <Image
                        src="/nav_button.png"
                        alt="Click to toggle"
                        width={25}
                        height={25}
                        className="button"
                      />
                    </button>
                    {/* Content toggled by button */}
                    {isMenue && (
                      <div>
                        <a href="#Specializations" className="menue"><div className="MenueItems">Specializations  <div className="MenueIcon"> {"-->"}</div></div> </a>
                        <a href="#Models" className="menue"><div className="MenueItems">Models   <div className="MenueIcon"> {"-->"}</div></div> </a>
                        <a href="#Social" className="menue"><div className="MenueItems">Social   <div className="MenueIcon"> {"-->"}</div></div> </a>
                      </div>
                    )}
                  </div>
                </>
              )}
              <a href="#" className="brand">AllMind AI</a>
              <div style={{display: "flex", flexDirection:"row", paddingLeft: "20px", alignItems: "top"}}>
                <a href="#Specializations" className="MenueItemsBar"><div>Specializations  </div> </a>
                <a href="#Models" className="MenueItemsBar"><div>Models  </div> </a>
                <a href="#Social" className="MenueItemsBar"><div>Social  </div> </a>
              </div>
            </div>
            <div>
              <div className="right">
                <button  className="search" onClick={() => setIsSearchOpen(prev => !prev)}>
                  <div>
                    <Image
                    src="/search_icon.png"
                    alt="Click to toggle"
                    width={0}
                    height={0}
                    style={{filter: 'invert(1)' ,width: 'auto', position:'relative', flex:1, paddingTop: '5px', cursor:"pointer"}}
                    />
                  </div>
                  <div style={{position: 'relative', flex:1, cursor:"pointer"}}>
                    Chatbot
                  </div>
                </button>
              </div>
              <div >
              {isSearch && (
                  <div>
                    <Chat/>
                  </div>
              )}
            </div>
            </div>
          </header>
        </div>
      </div>
      
      {/* main content container */}
      <main>
        {/* Specilizations */}
        <div className="content-section"  id="Specializations" >
          <div className="content-left">
            <div className="content-heading">
              AllMind 2.5 Stock Pridiction is here, and 2 Pro and Standard are now stable and generally available
            </div>
            <div className = "content-card">
              <div>
                June 2025
              </div>
              <div>
                Models
              </div>
              <div>
                Learn More {'>'}
              </div>
            </div>
            <div className = "content">
              <video controls width="100%" muted autoPlay loop>
                <source src="/StockPridiction.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <div className="content-right">
            <div>
              <div className="content-heading">
                Predict future prices and estimate your returns — in seconds.
              </div>
              <div className = "content-card">
                <div>
                  June 2025
                </div>
                <div>
                  Models
                </div>
                <div>
                  Learn More {'>'}
                </div>
              </div>
              <div className = "content">
                <video controls width="100%" muted autoPlay loop>
                  <source src="/ReturnOfInvestment.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <div>
              <div className="content-heading">
                  Rapid risk insights with live news sentiment and alerts
              </div>
              <div className = "content-card">
                <div>
                  June 2025
                </div>
                <div>
                  Models
                </div>
                <div>
                  Learn More {'>'}
                </div>
              </div>
              <div>
                <Image
                    src="/data_analysis.png"
                    alt="Click to toggle"
                    width={1500}
                    height={10}
                    className="contentImg"
                    />
              </div>
            </div>
            <div>
              <div className="content-heading">
                Smart auto-entry and stop-loss setup — so you trade faster, safer, and smarter.
              </div>
              <div className = "content-card">
                <div>
                  June 2025
                </div>
                <div>
                  Models
                </div>
                <div>
                  Learn More {'>'}
                </div>
              </div>
              <div >
                <Image
                  src="/stop_loss.png"
                  alt="Click to toggle"
                  width={500}
                  height={5}
                  className = "contentImg"
                  />
              </div>
            </div>
            <div>
              <div className="content-heading">
                A Data-Driven Approach to Quantifying Market Risk with AI
              </div>
              <div className = "content-card">
                <div>
                  June 2025
                </div>
                <div>
                  Models
                </div>
                <div>
                  Learn More {'>'}
                </div>
              </div>
              <div>
                <Image
                  src="/data.png"
                  alt="Click to toggle"
                  width={1500}
                  height={10}
                  className="contentImg"
                  />
              </div>
            </div>
            <div>
              <div className="content-heading">
                Our Vision of Unified Data and AI workspace for Institutional Investors
              </div>
              <div className = "content-card">
                <div>
                  June 2025
                </div>
                <div>
                  Models
                </div>
                <div>
                  Learn More {'>'}
                </div>
              </div>
              <div>
                <Image
                  src="/allmind_logo.png"
                  alt="Click to toggle"
                  width={1500}
                  height={10}
                  className="contentImg"
                  />
              </div>
            </div>
          </div>
        </div>

        {/* models */}
        <div className = "ModelSection"  id="Models">
          <div className="content-heading">
            Start Earning
          </div>
          <div className = "models">
            <div className="ModelScrollArea">
              <div className="ModelElement">
                <div>
                  <Image
                    src="/StockPilot.png"
                    alt="Click to toggle"
                    width={1500}
                    height={10}
                    className="ModelIcon"
                    />
                </div>
                <div className="content-heading">
                  Stock Pilot
                </div>
                <div className="ModelCard">
                  <div>
                    Our most intelligent stock pridiction product
                  </div>
                  <div style={{fontSize:'16px'}}>
                    It delivers real-time stock predictions, automated risk assessments, and ROI forecasts — all powered by AI-driven analysis of historical trends and live news. Make faster, data-backed decisions with confidence.
                  </div>
                </div>
              </div>
              <div className="ModelElement">
                <div>
                  <Image
                    src="/StockPilotNexus.png"
                    alt="Click to toggle"
                    width={1500}
                    height={10}
                    className="ModelIcon"
                    />
                </div>
                <div className="content-heading">
                  Stock Pilot Nexus
                </div>
                <div className="ModelCard">
                  <div>
                    Our Unified Data and AI workspace specially put together for Institutional investors
                  </div>
                  <div style={{fontSize:'16px'}}>
                    StockPilot Nexus is an institutional-grade AI platform designed to unify data, news, analytics, and predictive intelligence in one seamless workspace. Built for hedge funds, asset managers, and institutional investors, Nexus delivers real-time stock predictions, automated risk assessments, and actionable insights — all powered by cutting-edge AI and live market data. 
                  </div>
                </div>
              </div>
              <div className="ModelElement">
                <div>
                  <Image
                    src="/StockPilotVelocity.png"
                    alt="Click to toggle"
                    width={1500}
                    height={10}
                    className="ModelIcon"
                    />
                </div>
                <div className="content-heading">
                  Stock Pilot Velocity
                </div>
                <div className="ModelCard">
                  <div>
                    Our AI-tuned trading velocity — with your downside protected.
                  </div>
                  <div style={{fontSize:'16px'}}>
                    StockPilot Velocity is a high-frequency trading system engineered for institutional investors who demand speed without compromising control. It combines ultra-low-latency execution with intelligent auto stop-loss mechanisms, enabling precise trade entry and exit strategies in volatile market conditions.
                  </div>
                </div>
              </div>
              <div className="ModelElement">
                <div>
                  <Image
                    src="/StockPilotAutonomy.png"
                    alt="Click to toggle"
                    width={1500}
                    height={10}
                    className="ModelIcon"
                    />
                </div>
                <div className="content-heading">
                  Stock Pilot Autonomy
                </div>
                <div className="ModelCard">
                  <div>
                    Our Beta Fully autonomous trading — anywhere, anytime
                  </div>
                  <div style={{fontSize:'16px'}}>
                    AutoQuant is a fully autonomous AI trading system that executes trades on your behalf — across global markets, around the clock. Users simply select their preferred products, risk tolerance, and strategies, and the AI handles the rest: timing entries, adjusting positions, and securing exits at optimal moments.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* footer  */}
      <footer id="Social">
        <div className="social">
          <div className="SocialTitle">Follow us</div>
          <div className="SocialLinks">
            <div className="SocialIcon">
              <a href="https://www.linkedin.com/company/allmindai/" aria-label="Follow us on YouTube" target="_blank" data-gtm-tag="footer-selection" data-event-io="nav_select" data-event-nav-type="footer" data-event-nav-name="Follow us on YouTube">
                <Image src="/Linkedin.png" alt="fotter_linkedin" height={24} loading="lazy"  width={24} />
              </a>
            </div>
            <div className="SocialIcon">
              <a href="https://useallmind.ai/" aria-label="Follow us on LinkedIn" target="_blank" data-gtm-tag="footer-selection" data-event-io="nav_select" data-event-nav-type="footer" data-event-nav-name="Follow us on LinkedIn">
                <Image alt="footer__Website" height="24" loading="lazy" src="/allmind_logo.png" width="24"/>
              </a>
            </div>
          </div>
        </div>
        <div className="disclosure">
          Trade risponsibly and at your own risk
        </div>
      </footer>
    </div>
  );
}