// eslint-disable-next-line @typescript-eslint/ban-ts-comment 
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
// @ts-nocheck
function CampusReelCarousel(a, t, r) {
  // var o,
  //   s,
  //   l,
  //   i,
  //   n = new XMLHttpRequest(),
  //   c = '',
  //   p = 'https://www.campusreel.org/embed',
  //   d = arguments[3],
  //   u = '',
  //   m = !1
  // function g() {
  //   document.getElementById(a) &&
  //     ((function () {
  //       ;((l = document.createElement('div')).className = 'campusreel-videos-carousel'),
  //         ((o = document.createElement('div')).className = 'campusreel-carousel-scroll'),
  //         l.appendChild(o),
  //         document.getElementById(a).appendChild(l)
  //       for (var e = 0; e < s.length; e++) b(s[e])
  //       !(function () {
  //         var e = document.createElement('a')
  //         ;(e.innerHTML = 'Powered by'),
  //           (e.className = 'campusreel-carousel-powered-by'),
  //           (e.target = '_blank'),
  //           (e.href = 'https://www.campusreel.org/'),
  //           l.appendChild(e)
  //       })()
  //     })(),
  //     document.querySelector('.campusreel-modal') ||
  //       ((function () {
  //         var e = document.createElement('div')
  //         ;(e.className = 'campusreel-modal'),
  //           (e.innerHTML =
  //             '<div class="campusreel-modal-content"><div class="campusreel-iframe-loader-container"><div class="campusreel-iframe-loader-center"><div class="campusreel-iframe-loader"></div></div></div><button tabindex="1" class="btn-close-campusreel-modal"></button><iframe tabindex="1" src="about:blank" scrolling="no" class="campusreel-iframe" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe></div>'),
  //           document.body.appendChild(e),
  //           (window.onpopstate = function (e) {
  //             var a = document.querySelector('.campusreel-modal.campusreel-open')
  //             a && f(a)
  //           })
  //       })(),
  //       (function () {
  //         var e = document.querySelector('.campusreel-modal')
  //         e &&
  //           e.querySelector('.btn-close-campusreel-modal').addEventListener('click', function () {
  //             f(e)
  //           })
  //       })(),
  //       (function () {
  //         var e = document.querySelector('.campusreel-modal')
  //         e &&
  //           (e.querySelector('.btn-close-campusreel-modal').onblur = function () {
  //             m ? document.querySelector('.campusreel-iframe').focus() : this.focus()
  //           })
  //       })()),
  //     document.querySelector('#campusreel-modal-style') ||
  //       e(
  //         '.campusreel-iframe-loader-container {display: none;position: absolute;width: 100%;height: 100%;}.campusreel-modal {display: none;position: fixed;z-index: 1000;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background: -webkit-linear-gradient(135.74deg, rgba(36, 20, 58, 0.7) 0%, rgba(15, 14, 41, 0.7) 100%);background: -o-linear-gradient(135.74deg, rgba(36, 20, 58, 0.7) 0%, rgba(15, 14, 41, 0.7) 100%);background: linear-gradient(135.74deg, rgba(36, 20, 58, 0.7) 0%, rgba(15, 14, 41, 0.7) 100%);}.campusreel-modal-content {background-color: transparent;position: absolute;top: 0;left: 0;right: 0;bottom: 0;margin: auto;max-width: 90%;max-height: 90%;width: 1440px;height: 1024px;}.campusreel-modal-open {overflow: hidden;}.campusreel-modal-open >:not(.campusreel-modal) {-webkit-filter: blur(5px);-moz-filter: blur(5px);-o-filter: blur(5px);-ms-filter: blur(5px);filter: blur(5px);}.campusreel-iframe {background-color: transparent;border-radius: 5px;border: none;display: none;width: 100%;height: 100%;}.campusreel-iframe-loader-center {width: 67px;height: 67px;position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}.campusreel-iframe-loader {border: 8px solid #f3f3f3;border-radius: 50%;border-top: 8px solid #b739e8;width: 100%;height: 100%;-webkit-animation: campusreel-spin 2s linear infinite; /* Safari */animation: campusreel-spin 2s linear infinite;}@-webkit-keyframes campusreel-spin {0% { -webkit-transform: rotate(0deg); }100% { -webkit-transform: rotate(360deg); }}@keyframes campusreel-spin {0% { transform: rotate(0deg); }100% { transform: rotate(360deg); }}.campusreel-iframe-loader-container.campusreel-open, .campusreel-modal.campusreel-open, .campusreel-iframe.campusreel-open {display: block;}.campusreel-ie-message {position: absolute;top: calc(50% - 40px);color: #fff;line-height: 31px;text-align: center;}' +
  //           ('0.1' === i
  //             ? ".btn-close-campusreel-modal {position: absolute;top: 15px;right: 35px;border: none;width: 60px;height: 60px;border-radius: 50%;text-decoration: none;background: -webkit-linear-gradient(135.74deg, rgba(36, 20, 58, 0.3) 0%, rgba(15, 14, 41, 0.3) 100%);background: -o-linear-gradient(135.74deg, rgba(36, 20, 58, 0.3) 0%, rgba(15, 14, 41, 0.3) 100%);background: linear-gradient(135.74deg, rgba(36, 20, 58, 0.3) 0%, rgba(15, 14, 41, 0.3) 100%);}.btn-close-campusreel-modal:before {content: '';position: absolute;top: 0;background-image: url(https://www.campusreel.org/assets/icons/close.svg);left: 0;background-size: 22px;background-repeat: no-repeat;width: 100%;height: 100%;background-position: center;}@media (max-width: 1095px) {.btn-close-campusreel-modal {top: -4.5%;right: -10px;height: 30px;width: 30px;}.btn-close-campusreel-modal:before {background-size: 14px;}}"
  //             : ".btn-close-campusreel-modal {position: absolute;top: 25px;right: 35px;border: none;width: 60px;height: 60px;border-radius: 50%;text-decoration: none;background-color: #EEEEEE;outline: none;}.btn-close-campusreel-modal:before {content: '';position: absolute;top: 50%;left: 50%;background-image: url(https://www.campusreel.org/assets/icons/close-black-icon.png);background-repeat: no-repeat;background-size: cover;height: 32px;width: 32px;transform: translate(-50%, -50%);}@media (max-width: 1095px) {.btn-close-campusreel-modal {top: 20px;right: 5%;height: 45px;width: 45px;}.btn-close-campusreel-modal:before {height: 24px;width: 24px;}}"),
  //         'campusreel-modal-style',
  //       ),
  //     document.querySelector('#campusreel-carousel-style') ||
  //       e(
  //         ".campusreel-videos-carousel {width: 100%;height: 201px;overflow: auto;text-align: left;position: relative;}.campusreel-carousel-powered-by {display: block;position: relative;width: 60px;bottom: 5px;left: calc(50% - 60px);text-align: center;text-decoration: none;color: #43345a;font-size: 11px;height: 15px;font-family: unset;line-height: 15px;padding: 0;margin: 0;}.campusreel-carousel-powered-by:hover {opacity: 0.8;text-decoration: none;color: #43345a;}.campusreel-carousel-powered-by:before {content: '';position: absolute;right: -64px;top: 1px;width: 58px;height: 13px;background-repeat: no-repeat;background-size: 58px;background-image: url('https://www.campusreel.org/assets/icons/purple-logo.svg');}.campusreel-carousel-scroll {width: 100%;max-width: 1168px;min-width: 918px;margin: auto;}.campusreel-video-aspect-ratio {position: relative;max-width: 280px;height: 157px;overflow: hidden;display: inline-block;width: 24%;margin: 0.5%;cursor: pointer;min-width: 220px;border-radius: 5px;}.campusreel-video-item-info {position: absolute;width: 100%;top: 0;left: 0;height: 86px;background: linear-gradient(180deg, #000 0%, transparent 100%);padding: 20px;border-radius: 5px 5px 0px 0px;}.campusreel-video-tag {display: inline-block;font-size: 14px;margin: 0;color: #fff;}.campusreel-video-title {bottom: 10px;left: 20px;position: absolute;font-size: 14px;color: #fff;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;width: calc(100% - 40px);}.campusreel-play-icon {position: absolute;top: calc(50% - 20px);left: calc(50% - 20px);width: 40px;height: 40px;background: radial-gradient(circle, rgba(236,68,255,0.65) 0%, rgba(142,64,255,0.93) 53.11%, rgba(58,255,197,0.54) 100%) no-repeat;background-size: 80px 80px;background-position: bottom left;border-radius: 5px;}.campusreel-play-icon:before {content: '';position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);border-top: 6.5px solid transparent;border-right: 0px solid transparent;border-bottom: 6.5px solid transparent;border-left: 10px solid #fff;}.campusreel-video-item-thumb {position: absolute;width: 100%;height: 100%;border-radius: 5px;background-size: 100% 100%;}.campusreel-video-rating {display: inline-block;float: right;margin: 0;font-size: 14px;color: #fff;}.campusreel-video-rating:before{content: '';display: inline-block;vertical-align: middle;margin-right: 10px;width: 15px;height: 15px;background-image: url(https://www.campusreel.org/assets/icons/white-star.svg);background-repeat: no-repeat;}.campusreel-icons:before {content: '';display: inline-block;vertical-align: middle;margin-right: 10px;width: 18px;height: 17px;background-repeat: no-repeat;background-size: 18px;background-image: url('https://www.campusreel.org/assets/icons/campus.svg');}.campusreel-icons.dorms:before {width: 15px;background-size: 15px;margin-right: 7px;height: 15px;background-image: url('https://www.campusreel.org/assets/icons/dorms.svg');}.campusreel-icons.food:before {width: 20px;background-size: 20px;margin-right: 7px;height: 19px;background-image: url('https://www.campusreel.org/assets/icons/food.svg');}.campusreel-icons.academics:before {background-image: url('https://www.campusreel.org/assets/icons/academics.svg');}.campusreel-icons.social:before {background-image: url('https://www.campusreel.org/assets/icons/social_life.svg');}.campusreel-icons.interview:before {width: 15px;background-size: 15px;margin-right: 7px;height: 15px;background-image: url('https://www.campusreel.org/assets/icons/heart.png');}",
  //         'campusreel-carousel-style',
  //       ))
  // }
  // function b(e) {
  //   var a = document.createElement('div')
  //   a.setAttribute('tabindex', 0)
  //   var t =
  //     '<div class="campusreel-video-item-thumb" style="background-image: url(' +
  //     e.thumbnail +
  //     ');"><div class="campusreel-play-icon"></div></div><div class="campusreel-video-item-info"><p class="campusreel-icons campusreel-video-tag ' +
  //     e.tags[0] +
  //     '">' +
  //     e.tags[0] +
  //     '</p><p class="campusreel-video-rating">' +
  //     e.rating +
  //     '</p></div><p class="campusreel-video-title">' +
  //     e.title +
  //     '</p>'
  //   ;(a.id = 'campusreel-video-' + e.id),
  //     (a.className = 'campusreel-video-aspect-ratio'),
  //     (a.innerHTML = t),
  //     a.addEventListener('click', function () {
  //       h(this.id.split('campusreel-video-')[1])
  //     }),
  //     a.addEventListener('keyup', function (e) {
  //       13 === e.keyCode && h(this.id.split('campusreel-video-')[1])
  //     }),
  //     o.appendChild(a)
  // }
  // function h(e) {
  //   var a = document.querySelector('.campusreel-modal')
  //   if (a) {
  //     var t = a.querySelector('.campusreel-iframe-loader-container'),
  //       r = a.querySelector('.campusreel-iframe')
  //     t &&
  //       r &&
  //       (t.classList ? t.classList.add('campusreel-open') : (t.className += ' campusreel-open'),
  //       r.classList ? r.classList.remove('campusreel-open') : (r.className -= ' campusreel-open'),
  //       x(r, c + e),
  //       (a.querySelector('.campusreel-iframe').onload = function () {
  //         t.classList ? t.classList.remove('campusreel-open') : (t.className -= ' campusreel-open'),
  //           this.classList ? this.classList.add('campusreel-open') : (this.className += ' campusreel-open'),
  //           (this.onblur = function () {
  //             a.querySelector('.btn-close-campusreel-modal').focus()
  //           }),
  //           (m = !0)
  //       })),
  //       a.classList ? a.classList.add('campusreel-open') : (a.className += ' campusreel-open'),
  //       document.body.classList
  //         ? document.body.classList.add('campusreel-modal-open')
  //         : (document.body.className += ' campusreel-modal-open'),
  //       a.querySelector('.btn-close-campusreel-modal').focus()
  //   }
  // }
  // function f(e) {
  //   var a = e.querySelector('.campusreel-iframe')
  //   a && x(a, 'about:blank'),
  //     e.classList ? e.classList.remove('campusreel-open') : (e.className -= ' campusreel-open'),
  //     document.body.classList
  //       ? document.body.classList.remove('campusreel-modal-open')
  //       : (document.body.className -= ' campusreel-modal-open')
  // }
  // function x(e, a) {
  //   var t = document.createElement('iframe')
  //   ;(t.className = 'campusreel-iframe'),
  //     t.setAttribute('allowfullscreen', !0),
  //     t.setAttribute('webkitallowfullscreen', !0),
  //     t.setAttribute('mozallowfullscreen', !0),
  //     t.setAttribute('tabindex', '1'),
  //     (t.scrolling = 'no'),
  //     (t.src = a),
  //     e.parentNode.replaceChild(t, e),
  //     (m = !1)
  // }
  // function w(e, a) {
  //   d && d({ error: !e, success: e, college_status: a, requested_college_id: t })
  // }
  // function e(e, a) {
  //   var t = document.createElement('style')
  //   ;(t.id = a),
  //     (t.type = 'text/css'),
  //     t.styleSheet ? (t.styleSheet.cssText = e) : (t.innerHTML = e),
  //     document.head.appendChild(t)
  // }
  // localStorage.getItem('_campusreel_client_id')
  //   ? (u = localStorage.getItem('_campusreel_client_id'))
  //   : ((function () {
  //       for (var e = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', a = 0; a < 40; a++)
  //         u += e.charAt(Math.floor(Math.random() * e.length))
  //     })(),
  //     localStorage.setItem('_campusreel_client_id', u)),
  //   n.open(
  //     'GET',
  //     p +
  //       '/get_college?need_carousel=true&college_id=' +
  //       t +
  //       '&id_type=' +
  //       (isNaN(t) ? 'slug' : 'unit_id') +
  //       '&client_id=' +
  //       u +
  //       '&api_key=' +
  //       r,
  //     !0,
  //   ),
  //   (n.onreadystatechange = function () {
  //     if (4 == n.readyState && 200 == n.status) {
  //       w(!0, 'College exists and published!')
  //       var e = JSON.parse(n.responseText)
  //       ;(i = e.close_btn_design_version),
  //         (s = e.college_videos),
  //         (c =
  //           p +
  //           '?college_id=' +
  //           e.college_id +
  //           '&request_referer=' +
  //           e.request_referer +
  //           '&api_key=' +
  //           r +
  //           '&client_id=' +
  //           u +
  //           '&need_carousel=true&video_id='),
  //         'interactive' === document.readyState || 'complete' === document.readyState
  //           ? g()
  //           : document.addEventListener('DOMContentLoaded', function (e) {
  //               g()
  //             })
  //     }
  //     if (4 == n.readyState && 200 != n.status) {
  //       // Create CampusReel Empty Placeholder when carousel request fails
  //       const emptyPlaceholder = document.createElement('div')
  //       const emptyImage = document.createElement('img')
  //       emptyPlaceholder.className = 'empty-placeholder h3'
  //       emptyPlaceholder.textContent = 'No CampusReel Videos Available'
  //       emptyImage.className = 'empty-image h3'
  //       emptyImage.width = '50%'
  //       emptyImage.src = '/static/cwcommon/empty.png'
  //       emptyImage.alt = 'No Campus Reel Videos Available'
  //       document.getElementById(a).appendChild(emptyImage)
  //       document.getElementById(a).appendChild(emptyPlaceholder)
  //       console.log(n.responseText), w(!1, n.responseText)
  //     }
  //   }),
  //   n.send()
}
export default CampusReelCarousel
