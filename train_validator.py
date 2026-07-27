import os
import urllib.request
import numpy as np
import tensorflow as tf
from PIL import Image, ImageDraw, ImageFont
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.utils import load_img, img_to_array

# Directories
POSITIVE_XRAYS_DIR = "positive_xrays"
TRAIN_DIR = "validator_training"
os.makedirs(POSITIVE_XRAYS_DIR, exist_ok=True)
os.makedirs(TRAIN_DIR, exist_ok=True)

# 1. Download/Generate Negative Samples
neg_urls = {
    "face1.jpg": "https://picsum.photos/id/1005/400/400",  # person
    "face2.jpg": "https://picsum.photos/id/1025/400/400",  # dog/pet
    "scenery1.jpg": "https://picsum.photos/id/10/400/400", # scenery
    "scenery2.jpg": "https://picsum.photos/id/1015/400/400", # mountain
    "hands.jpg": "https://picsum.photos/id/1062/400/400",    # hands
    "flower.jpg": "https://picsum.photos/id/1080/400/400",   # flower
}

print("Downloading negative samples from Picsum Photos...")
for filename, url in neg_urls.items():
    path = os.path.join(TRAIN_DIR, "neg_" + filename)
    if not os.path.exists(path):
        try:
            urllib.request.urlretrieve(url, path)
            print(f"Downloaded {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

# Generate synthetic negative images to guarantee we have them
print("Generating synthetic negative samples...")

# Solid color/gradients (selfies, screenshots, blank images, colored objects)
colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255), (0, 0, 0), (255, 255, 255)]
for i, color in enumerate(colors):
    img = Image.new("RGB", (400, 400), color=color)
    img.save(os.path.join(TRAIN_DIR, f"neg_solid_{i}.jpg"))

# Noise images
for i in range(5):
    noise = np.random.randint(0, 256, (400, 400, 3), dtype=np.uint8)
    img = Image.fromarray(noise)
    img.save(os.path.join(TRAIN_DIR, f"neg_noise_{i}.jpg"))

# Gradients
for i in range(5):
    arr = np.zeros((400, 400, 3), dtype=np.uint8)
    for y in range(400):
        arr[y, :, 0] = int(y / 400 * 255)
        arr[y, :, 1] = int((400 - y) / 400 * 255)
        arr[y, :, 2] = (128 + i * 20) % 256
    img = Image.fromarray(arr)
    img.save(os.path.join(TRAIN_DIR, f"neg_gradient_{i}.jpg"))

# Documents (white backgrounds with black lines of text)
for i in range(10):
    img = Image.new("RGB", (400, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Draw horizontal text lines
    for line_y in range(20, 380, 20):
        line_length = np.random.randint(100, 350)
        draw.line([(20, line_y), (line_length, line_y)], fill=(0, 0, 0), width=np.random.randint(4, 10))
    img.save(os.path.join(TRAIN_DIR, f"neg_document_{i}.jpg"))

# Screenshots (various UI boxes, colors, shapes)
for i in range(10):
    img = Image.new("RGB", (400, 400), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Draw header bar
    draw.rectangle([(0, 0), (400, 50)], fill=(79, 70, 229))
    # Draw some boxes
    for _ in range(5):
        x1 = np.random.randint(10, 300)
        y1 = np.random.randint(60, 300)
        x2 = x1 + np.random.randint(50, 100)
        y2 = y1 + np.random.randint(50, 100)
        draw.rectangle([(x1, y1), (x2, y2)], fill=(np.random.randint(100, 255), np.random.randint(100, 255), np.random.randint(100, 255)))
    img.save(os.path.join(TRAIN_DIR, f"neg_screenshot_{i}.jpg"))

# Teeth photographs (Macro photos - pink gums, white teeth, high saturation color)
for i in range(10):
    img = Image.new("RGB", (400, 400), color=(240, 100, 120))  # Pink gums base
    draw = ImageDraw.Draw(img)
    # Draw yellowish/white teeth ellipses
    for tooth_x in range(50, 380, 70):
        draw.ellipse([(tooth_x - 20, 150), (tooth_x + 20, 250)], fill=(255, 253, 230), outline=(200, 100, 110), width=3)
    img.save(os.path.join(TRAIN_DIR, f"neg_teeth_photo_{i}.jpg"))


# 2. Collect Positive Samples (Dental X-rays)
pos_files = [f for f in os.listdir(POSITIVE_XRAYS_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
print(f"Found {len(pos_files)} dental X-ray positive files in {POSITIVE_XRAYS_DIR}")


# 3. Load pre-trained MobileNetV2 for feature extraction
print("Loading MobileNetV2 feature extractor...")
base_model = MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

def get_features_and_labels():
    X = []
    y = []
    
    # Process positive images (with data augmentation)
    for f in pos_files:
        path = os.path.join(POSITIVE_XRAYS_DIR, f)
        try:
            # Load original image
            img = load_img(path, target_size=(224, 224))
            arr = img_to_array(img)
            
            # Original feature
            X.append(arr)
            y.append(1.0)
            
            # Augmentation 1: Flip horizontal
            X.append(np.fliplr(arr))
            y.append(1.0)
            
            # Augmentation 2: Flip vertical
            X.append(np.flipud(arr))
            y.append(1.0)
            
            # Augmentation 3: Rotate 90 degrees
            X.append(np.rot90(arr, k=1))
            y.append(1.0)
            
            # Augmentation 4: Rotate 180 degrees
            X.append(np.rot90(arr, k=2))
            y.append(1.0)
            
        except Exception as e:
            print(f"Error loading positive image {f}: {e}")
            
    # Process negative images
    neg_files = [f for f in os.listdir(TRAIN_DIR) if f.startswith("neg_")]
    print(f"Found {len(neg_files)} negative files.")
    for f in neg_files:
        path = os.path.join(TRAIN_DIR, f)
        try:
            img = load_img(path, target_size=(224, 224))
            arr = img_to_array(img)
            X.append(arr)
            y.append(0.0)
            
            # Minor augmentation for negatives too
            if np.random.rand() > 0.5:
                X.append(np.fliplr(arr))
                y.append(0.0)
        except Exception as e:
            print(f"Error loading negative image {f}: {e}")
            
    X = np.array(X)
    y = np.array(y)
    
    # Preprocess for MobileNetV2
    X = preprocess_input(X)
    
    # Extract features in batches
    print("Extracting features...")
    features = base_model.predict(X, batch_size=32, verbose=1)
    return features, y

features, labels = get_features_and_labels()
print(f"Extracted features shape: {features.shape}, labels shape: {labels.shape}")

# Shuffle
indices = np.arange(len(features))
np.random.shuffle(indices)
features = features[indices]
labels = labels[indices]

# 4. Train the binary classifier
print("Training classifier...")
clf = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(1280,)),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

clf.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Split for validation
val_split = 0.2
clf.fit(
    features, labels,
    epochs=25,
    batch_size=16,
    validation_split=val_split,
    verbose=1
)

# Save the trained model
clf.save("xray_validator.h5")
print("Saved xray_validator.h5 successfully!")
