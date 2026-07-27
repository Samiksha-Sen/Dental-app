from flask import Flask, request, jsonify
import os
import time
import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import load_img, img_to_array
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load trained caries prediction model
model = tf.keras.models.load_model("caries_model1.h5")

# Load X-ray validation model and base feature extractor
print("Loading X-ray validation models...")
validation_base_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
validation_clf = tf.keras.models.load_model("xray_validator.h5")
print("Validation models loaded successfully.")


def predict_caries(filepath, threshold):
    # Get expected input size from model
    _, h, w, c = model.input_shape

    # Load image correctly
    if c == 1:
        img = load_img(
            filepath,
            target_size=(h, w),
            color_mode="grayscale"
        )
    else:
        img = load_img(
            filepath,
            target_size=(h, w)
        )

    # Convert image to array
    img = img_to_array(img)

    # Normalize
    img = img / 255.0

    # Add batch dimension
    img = np.expand_dims(img, axis=0)

    # Predict
    prediction = model.predict(img, verbose=0)

    print("Raw Prediction:", prediction)

    confidence = float(prediction[0][0])

    # Binary classification using the dynamic threshold parameter
    if confidence >= threshold:
        condition = "Caries Found"
        extraction = "Consultation for restorative treatment (Filling or RCT)"
        confidence_percent = confidence * 100
    else:
        condition = "No Caries Detected"
        extraction = "Routine oral hygiene and regular checkups"
        confidence_percent = (1 - confidence) * 100

    return (
        condition,
        extraction,
        round(confidence_percent, 2)
    )


# This is now a pure JSON API. The marketing site + clinical portal are both
# served by the dental_rn_app Expo Router web build (a separate deployment),
# which calls /predict directly. This process no longer renders any HTML.


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": model is not None and validation_clf is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        })

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        })

    # Read threshold from request, default to 0.85
    threshold = float(request.form.get("threshold", 0.85))

    # Secure a unique filename per request to avoid caching issues
    filename = f"xray_{int(time.time() * 1000)}_{file.filename}"
    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({
            "error": f"Failed to save uploaded image: {str(e)}"
        })

    # 1. Verify that image is not corrupted
    try:
        with Image.open(filepath) as img:
            img.verify()
    except Exception:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({
            "error": "Invalid or corrupted image file."
        })

    # 2. Check if image is blank/flat
    try:
        with Image.open(filepath) as img:
            # Convert to numpy array to calculate standard deviation
            arr = np.array(img)
            if np.std(arr) < 2.0:
                if os.path.exists(filepath):
                    os.remove(filepath)
                return jsonify({
                    "error": "X-ray not found.\nPlease upload a valid dental X-ray image."
                })
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({
            "error": f"Failed to process image: {str(e)}"
        })

    # 3. Check X-ray validity model
    try:
        # Load and preprocess for MobileNetV2
        v_img = load_img(filepath, target_size=(224, 224))
        v_arr = img_to_array(v_img)
        v_arr = np.expand_dims(v_arr, axis=0)
        v_arr = preprocess_input(v_arr)
        
        # Extract features
        feats = validation_base_model.predict(v_arr, verbose=0)
        
        # Run validation binary classifier
        prob = float(validation_clf.predict(feats, verbose=0)[0][0])
        print(f"Validation confidence for {file.filename}: {prob:.6f} vs threshold: {threshold:.6f}")
        
        if prob < threshold:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({
                "error": "X-ray not found.\nPlease upload a valid dental X-ray image."
            })
    except Exception as e:
        print(f"Validation model error: {e}")
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({
            "error": "Model prediction failed during validation."
        })

    # 4. Predict caries using primary caries model and the dynamic threshold
    try:
        condition, extraction, confidence = predict_caries(filepath, threshold)
    except Exception as e:
        print(f"Prediction model error: {e}")
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({
            "error": "Model prediction failed."
        })

    # Cleanup processed file
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Error removing temporary file: {e}")

    return jsonify({
        "condition": condition,
        "extraction": extraction,
        "confidence": confidence
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )