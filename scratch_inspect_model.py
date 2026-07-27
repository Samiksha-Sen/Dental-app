import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.utils import load_img, img_to_array
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input

print("Loading models...")
caries_model = tf.keras.models.load_model("caries_model1.h5")
val_base = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')
val_clf = tf.keras.models.load_model("xray_validator.h5")

def test_image(filepath):
    print(f"\n--- Testing Image: {filepath} ---")
    
    # Validation step
    try:
        v_img = load_img(filepath, target_size=(224, 224))
        v_arr = img_to_array(v_img)
        v_arr = np.expand_dims(v_arr, axis=0)
        v_arr = preprocess_input(v_arr)
        feats = val_base.predict(v_arr, verbose=0)
        prob = float(val_clf.predict(feats, verbose=0)[0][0])
        print(f"X-ray validation confidence: {prob:.4f}")
        if prob < 0.5:
            print("Model says: NOT a valid X-ray.")
            return
    except Exception as e:
        print(f"Error during validation: {e}")
        return

    # Caries prediction
    try:
        _, h, w, c = caries_model.input_shape
        img = load_img(filepath, target_size=(h, w), color_mode="grayscale" if c == 1 else "rgb")
        img = img_to_array(img) / 255.0
        img = np.expand_dims(img, axis=0)
        
        prediction = caries_model.predict(img, verbose=0)
        confidence = float(prediction[0][0])
        print(f"Raw Caries Prediction Score: {confidence:.4f}")
        if confidence >= 0.5:
            print(f"Result: CARIES DETECTED ({confidence*100:.2f}%) - Suggest Surgical Extraction")
        else:
            print(f"Result: NO CARIES DETECTED ({(1-confidence)*100:.2f}%) - Suggest Manual Extraction")
    except Exception as e:
        print(f"Error during caries prediction: {e}")

if __name__ == "__main__":
    test_files = [
        "uploads/test.jpg",
        "uploads/test2.jpg",
        "uploads/xray.jpg",
    ]
    for f in test_files:
        if os.path.exists(f):
            test_image(f)
        else:
            print(f"\nFile not found: {f}")
