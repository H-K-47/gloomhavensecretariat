import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import packageJson from '../../../../../package.json';
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { GameModel, GameState } from "src/app/game/model/Game";
import { Monster } from "src/app/game/model/Monster";
import { ghsHasSpoilers, ghsIsSpoiled, ghsNotSpoiled } from "../../helper/Static";
import { Objective } from "src/app/game/model/Objective";
import { ObjectiveData } from "src/app/game/model/data/ObjectiveData";
import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { FeedbackDialogComponent } from "../../tools/feedback/feedback-dialog";
import { SwUpdate } from "@angular/service-worker";
import { UndoDialogComponent } from "./undo/dialog";
import { Subscription } from "rxjs";
import { storageManager } from "src/app/game/businesslogic/StorageManager";

export enum SubMenu {
  main, edition, scenario, section, monster_add, monster_remove, character_add, character_remove, objective_add, objective_remove, settings, debug, server, datamanagement, about
}

@Component({
  selector: 'ghs-main-menu',
  templateUrl: 'menu.html',
  styleUrls: ['./menu.scss']
})
export class MainMenuComponent implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState
  SubMenu = SubMenu;
  active: SubMenu = SubMenu.main;
  standalone: boolean = false;
  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;
  version = packageJson.version;
  WebSocket = WebSocket;

  showHiddenMonster: boolean = false;
  characterLevel: number = 1;

  undoInfo: string[] = [];
  undoOffset: number = 0;
  redoInfo: string[] = [];

  constructor(@Inject(DIALOG_DATA) data: { subMenu: SubMenu, standalone: boolean }, private dialogRef: DialogRef, private dialog: Dialog, private swUpdate: SwUpdate) {
    this.active = data.subMenu;
    this.standalone = data.standalone;
    this.dialogRef.overlayRef.hostElement.style.zIndex = "2000";
  }

  ngOnInit(): void {
    this.updateUndoRedo();

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.updateUndoRedo();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  close() {
    this.dialogRef.close();
  }

  async updateUndoRedo() {
    if (gameManager.stateManager.undoCount > 0) {
      this.undoInfo = await storageManager.readFromList('undo-infos', gameManager.stateManager.undoCount - 1);
      const lastUndo = await storageManager.readFromList<GameModel>('undo', gameManager.stateManager.undoCount - 1);
      this.undoOffset = (gameManager.game.revision - (gameManager.game.revisionOffset || 0)) - (lastUndo.revision - (lastUndo.revisionOffset || 0)) - 1;
      this.undoOffset = 0;
      if (this.undoInfo.length > 1 && this.undoInfo[0] == "serverSync") {
        if (this.undoInfo[1] == "setInitiative" && this.undoInfo.length > 3) {
          this.undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.undoInfo[1], [this.undoInfo[2], ""])];
        } else {
          this.undoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.undoInfo[1], this.undoInfo.slice(2))];
        }
      } else if (this.undoInfo.length == 1 && this.undoInfo[0] == "serverSync") {
        this.undoInfo = ["serverSync", ""]
      }
    } else {
      this.undoInfo = [];
      this.undoOffset = 0;
    }
    if (gameManager.stateManager.redoCount > 0) {
      this.redoInfo = await storageManager.readFromList('undo-infos', gameManager.stateManager.undoCount);
      if (this.redoInfo.length > 1 && this.redoInfo[0] == "serverSync") {
        if (this.redoInfo[1] == "setInitiative" && this.redoInfo.length > 3) {
          this.redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.redoInfo[1], [this.redoInfo[2], ""])];
        } else {
          this.redoInfo = ["serverSync", settingsManager.getLabel('state.info.' + this.redoInfo[1], this.redoInfo.slice(2))];
        }
      } else if (this.redoInfo.length == 1 && this.redoInfo[0] == "serverSync") {
        this.redoInfo = ["serverSync", ""]
      }
    } else {
      this.redoInfo = [];
    }
  }

  async undo() {
    await gameManager.stateManager.undo();
  }

  async redo() {
    await gameManager.stateManager.undo();
  }

  openUndoDialog(event: any) {
    this.dialog.open(UndoDialogComponent, {
      panelClass: 'dialog'
    })
    this.close();
    event.preventDefault();
    event.stopPropagation();
  }

  setActive(active: SubMenu) {
    this.active = active;
  }

  hasSections(): boolean {
    return gameManager.editionData.some((editionData) => editionData.edition == gameManager.currentEdition() && editionData.sections && editionData.sections.length > 0);
  }

  characters(): Character[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Character;
    }).map((figure) => {
      return figure as Character;
    }).sort((a, b) => {
      const aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
      const bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  objectives(): Objective[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Objective;
    }).map((figure) => {
      return figure as Objective;
    }).sort((a, b) => {
      const aName = (a.title ? a.title : settingsManager.getLabel(a.name ? 'data.objective.' + a.name : (a.escort ? 'escort' : 'objective'))).toLowerCase();
      const bName = (b.title ? b.title : settingsManager.getLabel(b.name ? 'data.objective.' + b.name : (b.escort ? 'escort' : 'objective'))).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return a.id - b.id;
    });
  }

  monsters(): Monster[] {
    return gameManager.game.figures.filter((figure) => {
      return figure instanceof Monster;
    }).map((figure) => {
      return figure as Monster;
    }).sort((a, b) => {
      const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  hasHiddenMonster(): boolean {
    return gameManager.monstersData(gameManager.currentEdition()).some((monsterData) => monsterData.hidden);
  }

  monsterData(edition: string | undefined = undefined): MonsterData[] {
    return gameManager.monstersData(edition).filter((monsterData) => (!monsterData.hidden || monsterData.hidden == this.showHiddenMonster)).sort((a, b) => {
      const aName = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.boss && !b.boss) {
        return 1;
      }
      if (!a.boss && b.boss) {
        return -1;
      }

      if (a.hidden && !b.hidden) {
        return 1;
      }
      if (!a.hidden && b.hidden) {
        return -1;
      }

      if (a.spoiler && b.spoiler) {
        if (!this.isSpoiled(a) && this.isSpoiled(b)) {
          return 1;
        }
        if (this.isSpoiled(a) && !this.isSpoiled(b)) {
          return -1;
        }
      }

      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  async removeCharacter(character: Character) {
    await gameManager.stateManager.before("removeChar", "data.character." + character.name);
    gameManager.characterManager.removeCharacter(character);
    if (this.characters().length == 0) {
      this.close();
    }
    await gameManager.stateManager.after();
  }

  async removeAllCharacters() {
    await gameManager.stateManager.before("removeAllChars");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character))
    this.close();
    await gameManager.stateManager.after();
  }

  async addObjective() {
    await gameManager.stateManager.before("addObjective");
    gameManager.characterManager.addObjective();
    this.close();
    await gameManager.stateManager.after();
  }

  async addEscort() {
    await gameManager.stateManager.before("addEscort");
    gameManager.characterManager.addObjective(new ObjectiveData("escort", 3, true));
    this.close();
    await gameManager.stateManager.after();
  }

  async removeObjective(objective: Objective) {
    await gameManager.stateManager.before("removeObjective", objective.title || objective.name);
    gameManager.characterManager.removeObjective(objective);
    if (this.objectives().length == 0) {
      this.close();
    }
    await gameManager.stateManager.after();
  }

  async removeAllObjectives() {
    await gameManager.stateManager.before("removeAllObjectives");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Objective))
    this.close();
    await gameManager.stateManager.after();
  }

  async addMonster(monsterData: MonsterData) {
    await gameManager.stateManager.before("addMonster", "data.monster." + monsterData.name);
    gameManager.monsterManager.addMonster(monsterData, gameManager.game.level);
    if (this.hasAllMonster()) {
      this.close();
    }
    await gameManager.stateManager.after();
  }

  async removeMonster(monster: Monster) {
    await gameManager.stateManager.before("removeMonster", "data.monster." + monster.name);
    gameManager.monsterManager.removeMonster(monster);
    if (this.monsters().length == 0) {
      this.close();
    }
    await gameManager.stateManager.after();
  }

  async removeAllMonsters() {
    await gameManager.stateManager.before("removeAllMonster");
    gameManager.game.figures = gameManager.game.figures.filter((figure) => {
      return !(figure instanceof Monster);
    })
    this.close();
    await gameManager.stateManager.after();
  }

  hasMonster(monsterData: MonsterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Monster && monsterData.name == figure.name && monsterData.edition == figure.edition;
    })
  }

  hasAllMonster() {
    return gameManager.monstersData().every((monsterData) => gameManager.game.figures.some((figure) => figure instanceof MonsterData && figure.name == monsterData.name && figure.edition == monsterData.edition));
  }

  isUpdateAvailable(): boolean {
    return gameManager.stateManager.hasUpdate;
  }

  update(force: boolean = false): void {
    if (this.isUpdateAvailable() || force) {
      if (this.swUpdate.isEnabled) {
        this.swUpdate.activateUpdate().then(() => {
          this.clearAndRefresh();
        });
      } else {
        this.clearAndRefresh();
      }
    }
  }

  clearAndRefresh() {
    if ('caches' in window) {
      caches.keys()
        .then(function (keyList) {
          return Promise.all(keyList.map(function (key) {
            return caches.delete(key);
          }));
        })
    }
    window.location.reload()
  }

  feedbackDialog() {
    this.dialog.open(FeedbackDialogComponent, {
      panelClass: 'dialog'
    })
    this.close();
  }
}