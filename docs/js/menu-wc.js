'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">gestion-multiplataforma documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search">
    <input type="text" placeholder="Type to search">
    <button type="button"
        class="search-input-clear"
        aria-label="Clear search"
        data-search-input-clear>&times;</button>
</div>
` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="architecture.html" data-type="chapter-link">
                                        <span class="icon ion-ios-git-branch"></span>Architecture
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChartComponent.html" data-type="entity-link" >ChartComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DashboardPage.html" data-type="entity-link" >DashboardPage</a>
                            </li>
                            <li class="link">
                                <a href="components/DataTableComponent.html" data-type="entity-link" >DataTableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForbiddenPage.html" data-type="entity-link" >ForbiddenPage</a>
                            </li>
                            <li class="link">
                                <a href="components/HomePage.html" data-type="entity-link" >HomePage</a>
                            </li>
                            <li class="link">
                                <a href="components/ItemFormPage.html" data-type="entity-link" >ItemFormPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ItemsPage.html" data-type="entity-link" >ItemsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginPage.html" data-type="entity-link" >LoginPage</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfilePage.html" data-type="entity-link" >ProfilePage</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportsPage.html" data-type="entity-link" >ReportsPage</a>
                            </li>
                            <li class="link">
                                <a href="components/StatCardComponent.html" data-type="entity-link" >StatCardComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/HasPermissionDirective.html" data-type="entity-link" >HasPermissionDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/HasRoleDirective.html" data-type="entity-link" >HasRoleDirective</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ActivityStore.html" data-type="entity-link" >ActivityStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/FirestoreActivityStore.html" data-type="entity-link" >FirestoreActivityStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/LocalActivityStore.html" data-type="entity-link" >LocalActivityStore</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ActivityService.html" data-type="entity-link" >ActivityService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApiService.html" data-type="entity-link" >ApiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ExportService.html" data-type="entity-link" >ExportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GuardedRoutesPreloadingStrategy.html" data-type="entity-link" >GuardedRoutesPreloadingStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ItemsStore.html" data-type="entity-link" >ItemsStore</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/authGuard.html" data-type="entity-link" >authGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/authMatchGuard.html" data-type="entity-link" >authMatchGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/guestGuard.html" data-type="entity-link" >guestGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/unsavedChangesGuard.html" data-type="entity-link" >unsavedChangesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ActivityEvent.html" data-type="entity-link" >ActivityEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdminUser.html" data-type="entity-link" >AdminUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthTokens.html" data-type="entity-link" >AuthTokens</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChartSeries.html" data-type="entity-link" >ChartSeries</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExportColumn.html" data-type="entity-link" >ExportColumn&lt;T&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseConfig.html" data-type="entity-link" >FirebaseConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HasUnsavedChanges.html" data-type="entity-link" >HasUnsavedChanges</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Item.html" data-type="entity-link" >Item</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtClaims.html" data-type="entity-link" >JwtClaims</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginResponse.html" data-type="entity-link" >LoginResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MockUser.html" data-type="entity-link" >MockUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewItem.html" data-type="entity-link" >NewItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Profile.html" data-type="entity-link" >Profile</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Report.html" data-type="entity-link" >Report</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RowAction.html" data-type="entity-link" >RowAction&lt;T&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SortState.html" data-type="entity-link" >SortState&lt;T&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TableAction.html" data-type="entity-link" >TableAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TableColumn.html" data-type="entity-link" >TableColumn&lt;T&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserRow.html" data-type="entity-link" >UserRow</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
