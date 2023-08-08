set -eu

# Current commit
COMMIT=$(git rev-parse --short HEAD)
echo "Using commit: ${COMMIT}"

# Add git commit
cp index.html.template index.html
sed -i.bak "s/COMMIT/$COMMIT/g" index.html

# Build code
npm run build:site
