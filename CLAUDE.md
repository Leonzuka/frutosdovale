# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Flask-based farm management system** ("Frutos do Vale") for managing agricultural operations across multiple farms. The application provides modules for tracking tractors/equipment, employees, inventory, work records, and reporting.

## Architecture

### Backend Architecture
- **Main Application**: `app.py` - Single monolithic Flask application (~3500 lines)
- **Database**: MySQL with SQLAlchemy ORM using PyMySQL driver
- **Deployment**: Configured for Railway deployment with Gunicorn WSGI server
- **Session Management**: Farm selection stored in Flask sessions with farm-specific operations

### Frontend Architecture
- **Templates**: Jinja2 templates in `/templates/` directory (8 main pages)
- **Static Assets**: Organized in `/static/` with separate CSS/JS files per module
- **Styling**: Custom CSS with Font Awesome icons and Google Fonts (Inter)
- **JavaScript**: Module-specific JS files matching HTML templates

### Key Modules
1. **Farm Selection** (`select_farm.html`) - Multi-farm system entry point
2. **Dashboard** (`index.html`) - Main navigation after farm selection  
3. **Tractors** (`tractors.html`) - Equipment management and maintenance tracking
4. **Employees** (`funcionarios.html`) - Staff management and registration
5. **Work Records** (`apontamento.html`) - Activity tracking and time logging
6. **Inventory** (`estoque.html`) - Stock management and product tracking
7. **Reports** (`relatorios.html`) - Analytics and data visualization
8. **Consolidated** (`consolidado.html`) - Cross-farm reporting

## Development Commands

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
# OR using Flask CLI
export FLASK_APP=app.py
flask run

# Run with Gunicorn (production-like)
gunicorn wsgi:application
```

### Database Configuration
The application connects to a Railway MySQL database. Database URL is configured via environment variable `DATABASE_URL` with fallback to hardcoded Railway connection string.

### Deployment Commands
```bash
# Docker build (if needed)
docker build -t frutosdovale .
docker run -p 8080:8080 frutosdovale

# Railway deployment uses railway.toml configuration
# Automatic deployment via Railway's nixpacks builder
```

## Database Schema Patterns

The application uses several key database tables:
- `fazendas` - Farm/property management
- `maquinas` - Equipment/tractor records  
- `funcionarios` - Employee management
- `produtos` - Inventory items
- `apontamentos` - Work activity logging
- Various transaction/movement tables for tracking operations

## API Endpoints Structure

The application has ~50 REST endpoints following these patterns:
- `GET /` - Farm selection (entry point)
- `GET /index/<farm_id>` - Dashboard with farm context
- `GET /<module>` - Module main pages (tractors, funcionarios, etc.)
- `GET /get_<resource>` - Data fetching endpoints
- `POST /register_<action>` - Data creation endpoints  
- `PUT /update_<resource>` - Data modification endpoints
- `DELETE /delete_<resource>` - Data deletion endpoints
- `GET /download_<resource>` - Excel/PDF export endpoints

## File Structure Conventions

```
/templates/          # Jinja2 HTML templates
/static/
  /css/             # Module-specific stylesheets
  /js/              # Module-specific JavaScript  
  /images/          # Static assets
app.py              # Main Flask application
wsgi.py             # WSGI entry point
requirements.txt    # Python dependencies
railway.toml        # Railway deployment config
Dockerfile          # Container configuration
Procfile           # Heroku-style process definition
```

## Code Style Patterns

- **HTML**: Bootstrap-like card layouts with Font Awesome icons
- **CSS**: BEM-like naming, module-specific stylesheets
- **JavaScript**: Vanilla JS with fetch() API for AJAX calls
- **Python**: Flask patterns with direct SQL queries using SQLAlchemy text()
- **Database**: Raw SQL queries wrapped in SQLAlchemy text() for complex operations

## Key Development Notes

- Farm ID is stored in Flask session and required for most operations
- All forms use AJAX submissions with JSON responses
- Export functionality generates Excel/PDF files using openpyxl and reportlab
- Database queries often use raw SQL for complex reporting operations
- Static file versioning uses timestamp query parameters for cache busting