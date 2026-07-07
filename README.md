# emotion-prediction-api
# Emotion Prediction API

This project provides a Next.js frontend for interacting with a KServe-hosted DistilBERT Emotion Classification model.

## Prerequisites

* Kubernetes cluster with KServe installed
* Emotion model deployed
* `kubectl` configured
* Node.js and npm installed

---

## 1. Verify the InferenceService

Ensure the model is deployed and ready.

```bash
kubectl get inferenceservice -n kubeflow-user-example-com
```

---

## 2. Find the Predictor Pod

Retrieve the current predictor pod.

```bash
kubectl get pods -n kubeflow-user-example-com | grep distilbert-emotion
```

Example:

```text
distilbert-emotion-predictor-00003-deployment-d595d6f6-zpkqb
```

---

## 3. Test the Model Inside the Pod

Verify the model is serving predictions.

```bash
kubectl exec -n kubeflow-user-example-com \
$(kubectl get pods -n kubeflow-user-example-com | grep distilbert-emotion-predictor | awk '{print $1}') \
-c kserve-container -- \
curl -s -X POST http://localhost:8080/v1/models/distilbert-emotion:predict \
-H "Content-Type: application/json" \
-d '{"instances":["I am so happy today!"]}'
```

Expected response:

```json
{"predictions":[1]}
```

```
0 = sadness   1 = joy   2 = love
3 = anger     4 = fear  5 = surprise
```
---

## 4. Port Forward the Predictor

Expose the model locally.

```bash
kubectl port-forward -n kubeflow-user-example-com \
pod/$(kubectl get pods -n kubeflow-user-example-com | grep distilbert-emotion-predictor | awk '{print $1}') \
8080:8080
```

Keep this terminal running while using the frontend.

---

## 5. Verify the Local Endpoint

From another terminal:

```bash
curl -X POST \
http://localhost:8080/v1/models/distilbert-emotion:predict \
-H "Content-Type: application/json" \
-d '{
  "instances": [
    "I am so happy today!"
  ]
}'
```

---

## 6. Install Dependencies

```bash
npm install
```

---

## 7. Start the Frontend

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

---

## Useful Commands

### Check running pods

```bash
kubectl get pods -n kubeflow-user-example-com
```

### Check InferenceServices

```bash
kubectl get inferenceservice -n kubeflow-user-example-com
```

### Stop the port-forward

Press:

```text
Ctrl + C
```

---

## Typical Workflow

1. Verify the InferenceService is ready.
2. Find the current predictor pod.
3. Test inference from inside the pod.
4. Port-forward the predictor to `localhost:8080`.
5. Verify the endpoint using `curl`.
6. Install project dependencies (`npm install`).
7. Start the frontend (`npm run dev`).
8. Open `http://localhost:3000` and submit text for emotion prediction.
