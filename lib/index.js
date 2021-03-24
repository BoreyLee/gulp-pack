const { src, dest, parallel, series, watch } = require('gulp');

const del = require('del');

const browserSync = require('browser-sync');
const bs = browserSync.create();// 创建开发服务器

const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins();// 自动加载组件，以对象参数驼峰形式访问
// const sass = require('gulp-sass');
// const babel = require('gulp-babel');
// const swig = require('gulp-swig');
// const imagemin = require('gulp-imagemin');

const data = {
  menus: [
    {
      name: 'home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'features',
      link: 'features.html'
    },
    {
      name: 'about',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'link1',
          link: 'https://www.baidu.com'
        },
        {
          name: 'link2',
          link: 'https://www.sina.com'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}// 用于参数配置

/**删除文件 */
const clean = () => {
  return del(['dist', 'temp'])
}

/**样式转换 */
const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src' }) // 保留原始目录结构
    .pipe(plugins.sass()) // 转换sass文件(除了前缀有“_”)
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }));
}

/**js转换 */
const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' }) // 保留原始目录结构
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] })) // 转换js文件(没传入preset-env有可能转换不成功)
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }));
}

/**页面模板转换 */
const html = () => {
  return src('src/*.html', { base: 'src' }) // 保留原始目录结构
    .pipe(plugins.swig({ data, defaults: { cache: false } })) // 转换html文件，缓存会导致不更新
    .pipe(dest('temp'))
    .pipe(bs.reload({ stream: true }));
}

/**图片压缩 */
const image = () => {
  return src('src/assets/images/**', { base: 'src' }) // 保留原始目录结构
    .pipe(plugins.imagemin())
    .pipe(dest('dist'));
}

/**字体压缩 */
const font = () => {
  return src('src/assets/fonts/**', { base: 'src' }) // 保留原始目录结构
    .pipe(plugins.imagemin())
    .pipe(dest('dist'));
}

/**复制文件 */
const extra = () => {
  return src('public/**', { base: 'public' }) // 保留原始目录结构
    .pipe(dest('dist'));
}

/**服务器配置 */
const serve = () => {
  /**监视文件改变 */
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', html)

  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload);// 资源文件更新重新加载

  bs.init({
    notify: false,// 消息提示
    port: 6060,// 端口
    // open: false,// 是否自动打开浏览器
    files: 'temp/**',// 监听文件变化
    server: {
      baseDir: ['temp', 'src', 'public'],// 依次往数组中文件寻找，实现开发阶段不执行image、font、extra
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

/**压缩文件 */
const useref = () => {
  return src('temp/*.html', { base: 'temp' })
    .pipe(plugins.useref({ searchPath: ['temp', '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify())) // js压缩
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) // css压缩
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    }))) // html压缩
    .pipe(dest('dist'))
}

const compile = parallel(style, script, html);// 任务组合

const build = series(
  clean,
  parallel(series(compile, useref),
    image,
    font,
    extra
  ));// 先删除原有dist文件，再编译转换

const develop = series(compile, serve);// 开发命令

module.exports = {
  style,
  script,
  html,
  image,
  font,
  compile,
  extra,
  useref,
  serve,

  clean,
  develop,
  build,
}