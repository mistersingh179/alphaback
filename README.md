# Commands

- Watch & Run Tests `chokidar "**/*.js" "**/*.sol" -c "yarn test"`
- Watch & Run Tests `REPORT_GAS=1 hh watch test --network hardhat`
- Watch & Run Tests `hh watch test --network hardhat`
- `yarn build` & then in `build` directory start server `serve . -s`
- to manually upload files to cloudflare `npx wrangler pages publish ./build --project-name foobar --branch master`
- this is uploading to `master` branch in cloudflare. that may not be the production branch.
- 
# Todo

- ui should show preview of image
- use checkupkeep & performUpKeep to keep promo dates to dates in future