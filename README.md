# Seven Gram

## 📌 Prerequisites

- `Node.js` v22 or greater
- `Npm` v10 or greater

You can install these by [this link](https://nodejs.org/en/download/)

## ❓ How to run

1. Install `pm2` npm package globally

    ```sh
    npm i pm2 -g
    ```

2. Install project dependencies

    ```sh
    npm ci
    ```

3. Run build

    ```sh
    npm run build
    ```

4. Start app

    ```sh
    npm run pm2:start
    ```

## Notes 📝

- To run farming mini apps on main session type `.miniapps togglemainsession`. To add additional sessions type `.miniapps addsession`

- User commands (e.g., .help, .update, etc.) do not work in `Saved Messages`

- Currently, there are no settings avaliable, so when you start the app, the bot will automatically play all supported minigames

- Use the bot at your own risk!

## Notes for DEVs 👨🏻‍💻

- To start development, run the server that will watch for changes and build app by running `npm run build:watch`. After making changes, run the application using `npm run start`

- Before running srarting the app, make sure you have the `.env` file. You can create it by running `cp .env.example .env.` command

- If the environment variable `NODE_ENV` is set to `local`, user-commands will be available with the `dev` prefix (e.g., .devhelp, .devping, etc.)

## 📃 Getting API Keys

1. Go to [my.telegram.org](https://my.telegram.org) and log in using your phone number.

2. Select **"API development tools"** and fill out the form to register a new application.
3. Note down the `API_ID` and `API_HASH` in `.env` file provided after registering your application.

## 📸 Screenshots

Log info to special channel on your main telegram accout

![image](https://github.com/user-attachments/assets/d2342433-097e-47b4-a0a2-311fe4f21edc)

![image](https://github.com/user-attachments/assets/64e706c3-dcdd-4940-827e-b82ba4d76f14)

Commands avaliable from every chats (instead notes)

![image](https://github.com/user-attachments/assets/6574ac3d-c871-4b01-8216-8fdad73b8e53)
