from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy45
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# ... rest of the code remains the same ...

# Configuration for uploads and database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///rural_data.db'
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_PATH'] = 2048

# Initialize the database
db = SQLAlchemy(app)

# Define the data model
class RuralArea(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    location = db.Column(db.String(80), nullable=False)
    population = db.Column(db.Integer, nullable=False)
    energy_source = db.Column(db.String(80), nullable=False)
    water_status = db.Column(db.String(80), nullable=False)
    image = db.Column(db.String(120), nullable=True)

# Route for rendering the homepage with form
@app.route('/')
def index():
    return render_template('index.html')

# API to handle form submissions
@app.route('/submit', methods=['POST'])
def submit_data():
    location = request.form['location']
    population = request.form['population']
    energy_source = request.form['energy_source']
    water_status = request.form['water_status']
    
    # Handle the file upload
    if 'image' not in request.files:
        return 'No file uploaded', 400
    
    image = request.files['image']
    if image.filename == '':
        return 'No selected file', 400
    
    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Save the data into the database
        rural_area = RuralArea(location=location, population=population, 
                               energy_source=energy_source, water_status=water_status, 
                               image=filename)
        db.session.add(rural_area)
        db.session.commit()
        
        return 'Data submitted successfully!', 200

# API to fetch data for charting
@app.route('/data', methods=['GET'])
def get_data():
    areas = RuralArea.query.all()
    data = [{'location': area.location, 'population': area.population, 
             'energy_source': area.energy_source, 'water_status': area.water_status} 
            for area in areas]
    return jsonify(data)

# Main function to create tables and run the application
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Ensure the database and tables are created
    app.run(debug=True)
