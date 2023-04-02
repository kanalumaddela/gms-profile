// ==UserScript==
// @name         gmodstore user profile steam card
// @namespace    https://www.maddela.org
// @version      0.1
// @description  Destroy Nobody's attempt at this!
// @author       kanalumaddela
// @updateURL    https://raw.githubusercontent.com/kanalumaddela/gms-profile/master/gms-profile.js
// @downloadURL  https://raw.githubusercontent.com/kanalumaddela/gms-profile/master/gms-profile.js
// @supportURL   https://github.com/kanalumaddela/gms-profile/issues
// @source       https://github.com/kanalumaddela/gms-profile
// @match        *://steamcommunity.com/id/*
// @match        *://steamcommunity.com/profiles/*
// @connect      gmodstore.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    const menu_command_id = GM_registerMenuCommand("Show Alert", function(ev) {
        alert("Menu item selected");
    }, "a");

    var config = {
        api: {
            access_token: '',
            bans: 'https://api.gmodstore.com/v2/users/{steamid}?with=bans,group'
        },
        custom_css: ''
    };

    config.css = `
	#gms-info .profile_customization_block {
		position: relative;
	}
	#gms-info-credit {
		position: absolute;
		top: 12px;
		right: 10px;
		font-size: 13px;
	}
	#gms-info-credit a:hover {
		text-decoration: underline;
	}

	#gms-info-update {
		position: absolute;
		right: 7px;
	}

	#gms-info-profile, #gms-info-bans {
		padding: 5px 0;
	}
	#gms-info-profile .profile_customization_header, #gms-info-bans .profile_customization_header {
		margin-bottom: 5px;
	}
	#gms-info-bans table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	#gms-info-bans table thead {
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}
	#gms-info-bans table td {
		padding: 8px;
	}
	#gms-info-bans table td:not(:last-child) {
		border-right: 2px solid rgba(255, 255, 255, 0.2);
	}
	`;


    /* do not touch below */

    function stringToHTML(string) {
        let elem = document.createElement('div');
        elem.innerHTML = string;

        return elem.childNodes[0];
    }

    function prepend(child, parent) {
        parent.insertBefore(child, parent.firstChild);
    }

    function append(child, parent) {
        parent.appendChild(child);
    }

    const elem = (tag, attrs = {}, ...children) => {

        if (typeof children[0] !== 'undefined') {
            if (children[0].constructor === Array) {
                children = children[0];
            }
        }

        const elem = document.createElement(tag);
        Object.keys(attrs).forEach(function(key) {
            if (key in document.createElement(tag)) {
                elem[key] = attrs[key];
            } else {
                elem.setAttribute(key,attrs[key]);
            }
        });

        children.forEach(child => {
            if (typeof child === "string") {
                child = document.createTextNode(child);
            }

            elem.appendChild(child);
        });

        return elem;
    };

    const cache = {
        init: function() {
            if (typeof(Storage) == "undefined") {
                alert('localStorage does not exist, cannot cache');
                return;
            }

            if (cache.exists('expirations')) {
                var expirations = cache.get('expirations');

                if (expirations.length > 0) {
                    for (var i = 0; i < expirations.length; i++) {
                        let expire = expirations[i];
                        let key = Object.keys(expire)[0];

                        let expire_date = new Date(expire[key]);
                        let current_date = new Date();

                        if (current_date >= expire_date) {
                            cache.remove(key);
                            expirations.splice(i, 1);
                        }
                    }

                    cache.set('expirations', expirations, -1);
                }
            } else {
                cache.set('expirations', [], -1)
            }
        },
        set: function(key, value, time = 3600) {
            let json_value = JSON.stringify(value);

            localStorage.setItem(key, json_value);
            if (time > 0 && time !== Infinity) {
                let expirations = cache.get('expirations');
                let date = new Date();
                date.setSeconds(date.getSeconds() + time);

                expirations.push({[key]: date});

                cache.set('expirations', expirations, -1);
            }

            return value;
        },
        remove: function(key) {
            localStorage.removeItem(key);
        },
        clear: function() {
            localStorage.clear();
        },
        get: function(key) {
            return cache.exists(key) ? JSON.parse(localStorage.getItem(key)) : null;
        },
        exists: function(key) {
            return typeof localStorage[key] !== 'undefined';
        },
        remember: function(key, time, callback) {
            return cache.exists(key) ? cache.get(key) : cache.set(key, callback(), time);
        }
    };

    cache.init();

    let user = g_rgProfileData;

    let profile_elem = document.querySelector(".profile_leftcol");

    prepend(
        elem('div', {id: 'gms-info', className: 'profile_customization'},
            elem('style', {innerText: config.css}),
            elem('div', {className: 'profile_customization_header ellipsis', style: 'position: relative;'},
                elem('img', {src: 'https://media.gmodstore.com/assets/img/gmodstore.svg', style: 'padding: 10px 0 0; width: 200px;'}),
                elem('span', {id: 'gms-info-credit', innerText: 'by '},
                    elem('a', {href: 'https://www.gmodstore.com/users/kanalumaddela/addons', target: '_blank', innerText: '@kanalumaddela', style: 'color: #5491cf;'})
                )
            ),
            elem('div', {className: 'profile_customization_block'},
                elem('div', {className: 'customtext_showcase'},
                    elem('div', {className: 'showcase_content_bg showcase_notes'},
                        elem('div', {},
                            elem('a', {id: 'gms-info-update', className: 'btn_profile_action btn_small_tall', 'data-tooltip-html': 'Click to clear cache and retrieve fresh info'},
                                elem('span', {innerHTML: '&#128472; Refresh'})
                            )
                        ),
                        elem('div', {id: 'gms-info-profile'},
                            elem('h1', {className: 'profile_customization_header bb_h1', innerText: 'Profile'})
                        ),
                        elem('br'),
                        elem('div', {id: 'gms-info-bans'},
                            elem('h1', {className: 'profile_customization_header bb_h1', innerText: 'Bans'})
                        )
                    )
                )
            ),
        ), profile_elem);

    function gmsInfo(data) {
        let bans = data.bans;

        let gms_profile = document.getElementById('gms-info-profile');

        let country_flag = '<img src="https://steamcommunity-a.akamaihd.net/public/images/countryflags/' + data.country_code.toLowerCase() + '.gif" alt="">';

        append(
            elem('div', {},
                elem('p', {innerHTML: `<span class="community_content_update_get_it_now">Username:</span> ${data.name}`}),
                elem('p', {innerHTML: `<span class="community_content_update_get_it_now">Rank:</span> ${data.group.title}`}),
                elem('p', {innerHTML: `<span class="community_content_update_get_it_now">Country:</span> ${country_flag}`})
            ), gms_profile);

        append(
            elem('a', {href: `https://www.gmodstore.com/users/${user.steamid}`, target: '_blank', className: 'btn_profile_action btn_medium'},
                elem('span', {innerText: 'View Profile'})
            ), gms_profile);

        if (bans.length > 0) {
            // community_ban_notice

            let table = stringToHTML(cache.remember(`gms-bans-html-${user.steamid}`, 3600, function() {
                let rows = [];
                for (var i = 0; i < bans.length; i++) {
                    let ban = bans[i];

                    ban.type = ban.properties[0];

                    rows.push(
                        elem('tr', {},
                            elem('td', {innerText: ban.start}),
                            elem('td', {innerText: ban.type}),
                            elem('td', {innerText: ban.reason}),
                            elem('td', {innerText: (ban.end ? ban.end : 'Never')}),
                        )
                    );
                }

                let table = elem('table', {},
                    elem('thead', {},
                        elem('tr', {},
                            elem('td', {innerText: 'Date'}),
                            elem('td', {innerText: 'Type'}),
                            elem('td', {innerText: 'Reason'}),
                            elem('td', {innerText: 'Expires'})
                        )
                    ),
                    elem('tbody', {}, rows)
                );

                return table.outerHTML;
            }));

            append(table, document.getElementById('gms-info-bans'));
        }
    }

    var api_url = config.api.bans.replace('{steamid}', user.steamid);

    if (cache.exists(`gms-data-${user.steamid}`)) {
        console.log('Data Cached!! Retrieving...');

        gmsInfo(cache.get(`gms-data-${user.steamid}`));
    } else {
        console.log('No Cache. Retrieving...');

        GM_xmlhttpRequest({
            url: api_url,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${config.api.key}`,
                'Cache-Control': 'no-cache',
            },
            onload: function (response) {
                let json = JSON.parse(response.responseText);

                if (typeof json.data !== 'undefined') {
                    let data = json.data;

                    console.log(data);

                    cache.set(`gms-data-${user.steamid}`, data);

                    gmsInfo(data);
                } else {
                    let no_info = elem('p', {innerText: 'User info could not be retrieved'});

                    append(no_info, document.getElementById('gms-info-profile'));
                    append(no_info, document.getElementById('gms-info-bans'));
                }
            }
        });
    }

})();
