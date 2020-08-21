/* 
[[roam/js]] plugin
---
@name         Andy Gao
@namespace    github.com/andyjgao
@version      0.1
@description  Modify Page Width by dragging and allow reordering of side pages
@author       Andy Gao
---
For usage, please read the README.md
*/

//Global ShiftKey Event Listener to be used with side pages
var keyPress = false;
window.addEventListener("keydown", (event) => {
    if (event.shiftKey) {
        console.log("hi");
        keyPress = true;
    }
});
window.addEventListener("keyup", (event) => {
    if (keyPress) {
        console.log("bi");
        keyPress = false;
    }
});

//Main Page Code
(function () {
    /* Helper Functions */

    //function used to calculate and set resize of page
    function resize(element, typeWidth) {
        return function (e) {
            const dx = e.x - m_pos;
            m_pos = e.x;
            var pixelWidth =
                parseInt(getComputedStyle(element, "").maxWidth) + dx;
            document.documentElement.style.setProperty(
                typeWidth,
                pixelWidth + "px"
            );
        };
    }
    //adds event listener to find offset
    function position(e) {
        if (roamArticle.offsetWidth - 35 <= e.offsetX) {
            m_pos = e.x;
            document.addEventListener("mousemove", curResize, false);
        }
    }

    //function used to move Page Card on mouse down
    function runPageChange(m_pos, pageWidth, roamArticle, curResize) {
        roamArticle.addEventListener("mousedown", position, false);
        let removeThis = function () {
            document.removeEventListener("mousemove", curResize, false);
        };
        document.addEventListener("mouseup", removeThis, false);
        return removeThis;
    }

    //initialize values
    let m_pos;
    let roamArticle = document.querySelector("div.roam-article");
    let pageWidth = "--page-width";
    let curResize = resize(roamArticle, pageWidth);
    let removeEventHandlerFunction = runPageChange(
        m_pos,
        pageWidth,
        roamArticle,
        curResize
    );

    //reset values on page-change
    window.addEventListener(
        "hashchange",
        function () {
            roamArticle.removeEventListener("mousedown", position, false);
            document.removeEventListener(
                "mouseup",
                removeEventHandlerFunction,
                false
            );
            roamArticle = document.querySelector("div.roam-article");
            pageWidth = "--page-width";
            curResize = resize(roamArticle, pageWidth);
            removeEventHandlerFunction = runPageChange(
                m_pos,
                pageWidth,
                roamArticle,
                curResize
            );
        },
        false
    );
})();

//Side Page Code

(function () {
    //Import packages
    let packageGen = new Promise((resolve, reject) => {
        try {
            var jQueryScript = document.createElement("script");
            jQueryScript.setAttribute(
                "src",
                "https://cdn.jsdelivr.net/npm/sortablejs@1.10.2/Sortable.min.js"
            );
            document.head.appendChild(jQueryScript);
            setTimeout(() => resolve("loaded"), 500);
        } catch {
            reject(new Error("Error setting up Javascript Packages"));
        }
    });

    packageGen
        .then((result) => {
            //resize side pages
            function resize(element, typeWidth) {
                return function (e) {
                    const dx = e.x - m_pos;
                    m_pos = e.x;
                    var pixelWidth =
                        parseInt(getComputedStyle(element, "").maxWidth) + dx;
                    document.documentElement.style.setProperty(
                        typeWidth,
                        pixelWidth + "px"
                    );
                };
            }
            //add event listener to find offset
            function position(element, otherFunc) {
                return function (e) {
                    if (keyPress && element.offsetWidth - 35 <= e.offsetX) {
                        m_pos = e.x;
                        document.addEventListener(
                            "mousemove",
                            otherFunc,
                            false
                        );
                    }
                };
            }
            //function used to activate code only when sidebar is open
            function waitForAddedNode(params) {
                new MutationObserver(function (mutations) {
                    var el = document.getElementById(params.id);
                    if (el) {
                        for (let id in params.mouseUpEventHandlers) {
                            document.removeEventListener(
                                "mouseup",
                                params.mouseUpEventHandlers[id],
                                false
                            );
                        }
                        params.done(el);
                    }
                }).observe(params.parent || document, {
                    subtree: !!params.recursive,
                    childList: true,
                });
            }

            //unique id generator to help with eventListener cleanup
            function createId(init = 0) {
                return {
                    next: () => init++,
                    curr: init,
                };
            }

            //initialize values
            var counter = createId(0);

            var documentEventHandlersObject = {};

            waitForAddedNode({
                id: "roam-right-sidebar-content",
                parent: document.getElementById("right-sidebar"),
                recursive: false,
                mouseUpEventHandlers: documentEventHandlersObject,
                done: function (el) {
                    let firstDiv = document.querySelector(
                        "#roam-right-sidebar-content > div"
                    );
                    firstDiv.id = "sidePage" + counter.next();
                    let curResize = resize(firstDiv, "--page-side-width");
                    firstDiv.addEventListener(
                        "mousedown",
                        position(
                            document.querySelector(
                                "#roam-right-sidebar-content > div"
                            ),
                            curResize
                        ),
                        false
                    );
                    let removeHandler = function () {
                        document.removeEventListener(
                            "mousemove",
                            curResize,
                            false
                        );
                    };
                    document.addEventListener("mouseup", removeHandler, false);
                    documentEventHandlersObject[firstDiv.id] = removeHandler;
                    sideBarMutationObserver(el);
                    Sortable.create(el, {
                        direction: "horizontal",
                        animation: 150,
                        swap: true,
                        swapClass: "highlight",
                        ghostClass: "ghost",
                        easing: "cubic-bezier(.41,1.61,0,-0.57)",
                    });
                },
            });

            //mutation observer to perform appropriate functions on sideBar changes
            function sideBarMutationObserver(el) {
                // Options for the observer (which mutations to observe)
                const config = {
                    attributes: false,
                    childList: true,
                    subtree: false,
                };

                // Callback function to execute when mutations are observed
                const callback = function (mutationsList, observer) {
                    for (let mutation of mutationsList) {
                        let curResize;
                        if (
                            mutation.addedNodes[0] &&
                            mutation.target.id === "roam-right-sidebar-content"
                        ) {
                            mutation.addedNodes[0].id =
                                "sidePage" + counter.next();
                            curResize = resize(
                                mutation.addedNodes[0],
                                "--page-side-width"
                            );
                            mutation.addedNodes[0].addEventListener(
                                "mousedown",
                                position(mutation.addedNodes[0], curResize),
                                false
                            );
                            let removeHandler = function () {
                                document.removeEventListener(
                                    "mousemove",
                                    curResize,
                                    false
                                );
                            };
                            document.addEventListener(
                                "mouseup",
                                removeHandler,
                                false
                            );
                        } else if (
                            mutation.removedNodes[0] &&
                            mutation.target.id === "roam-right-sidebar-content"
                        ) {
                            document.removeEventListener(
                                "mouseup",
                                documentEventHandlersObject[
                                    mutation.removedNodes[0].id
                                ],
                                false
                            );
                            delete documentEventHandlersObject[
                                mutation.removedNodes[0].id
                            ];
                        }
                    }
                };
                // Create an observer instance linked to the callback function
                const observer = new MutationObserver(callback);
                // Start observing the target node for configured mutations
                observer.observe(el, config);
            }
        })
        .catch(alert);
})();
