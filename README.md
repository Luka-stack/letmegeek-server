# Let Me Geek - Backend

Let Me Geek is often abbreviated as LMG, is a game, book, comic, and manga (so-called articles) social networking and social cataloging application website run by volunteers. The site provides its users with a list-like system to organize and score the previously mentioned articles. Its main goal is to help people find next they should read/watch/play and also keep track of what they have already seen/read e.t.c. It facilitates finding users who share similar tastes and provides.

## [Click here to view Frontend]()
The frontend for this project is located on another repository.

## Installation
### Docker
Not provided yet.

### Standard
Use the package manager [npm](https://yarnpkg.com/).
```bash
npm install
```

## Run
### Docker
Not provided yet.

### Standard
All the commends are listed in [package.json]().

Also before you run the application you should add your own settings. All parameters are set in .env.stage.* file. Here is an example [.env.stage.dev](). You need to provide your own values for:
1. Database
2. Mailer
3. JWT

To start the project use
```bash
yarn start
yarn start:dev
```

To run tests
```bash
yarn test
yarn test:watch # run tests with a live reload
yarn test:e2e
yarn test:e2e:watch # run 2e2 tests with a live reload
```
## Postman
All of the endpoints were also tested using Postman. The tests can be found here [postman.tests]().

## [Click here to view SQL Schema]

## Helpful Sources
1. [NestJS Documentation](https://docs.nestjs.com/)
2. [TypeORM](https://typeorm.io/#/)
3. [Classsed - YT Channel](https://www.youtube.com/channel/UC2-slOJImuSc20Drbf88qvg)
4. [Marius Espejo - YT Channel](https://www.youtube.com/channel/UCDpd-qEwAI9wglx4tsEBAtw)
5. [NestJS Zero to Hero](https://www.udemy.com/course/nestjs-zero-to-hero/)


## License
[MIT](https://choosealicense.com/licenses/mit/)
