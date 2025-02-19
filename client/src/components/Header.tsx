import "../App.css";
import { Button } from "../components/ui/button";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="header-container" >
      <div className="Header1">
        <Link href="/" className="company-name glimmer-text justify-content">
          <h2>Relapse Prediction Study</h2>
        </Link>
      </div>
      <div className="Header2">
        <nav className="nav">
          <Link href="/">
            <Button className="company-name">
              Login
            </Button>
          </Link>
          <Link href="/about">
            <Button className="company-name">
              About
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}