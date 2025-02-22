import { Dialog } from "@angular/cdk/dialog";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { PartySheetDialogComponent } from "../../party/party-sheet-dialog";
import { BattleGoalSetupDialog } from "src/app/ui/figures/battlegoal/setup/battlegoal-setup";
import { ItemsDialogComponent } from "src/app/ui/figures/items/dialog/items-dialog";
import { GameState } from "src/app/game/model/Game";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { Party } from "src/app/game/model/Party";


@Component({
    selector: 'ghs-campaign-menu',
    templateUrl: 'campaign.html',
    styleUrls: ['../menu.scss', 'campaign.scss']
})
export class CampaignMenuComponent implements OnInit {

    @Output() close = new EventEmitter();

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    GameState = GameState;
    conditions: Condition[] = [];
    amConditions: Condition[] = [];
    editionConditions: ConditionName[] = [];
    characters: Character[] = [];

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.update();
    }

    update() {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character).sort((a, b) => {
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

        this.conditions = Object.values(ConditionName).map((name) => new Condition(name)).filter((condition) => condition.types.indexOf(ConditionType.hidden) == -1);
        this.amConditions = Object.values(ConditionName).map((name) => new Condition(name)).filter((condition) => condition.types.indexOf(ConditionType.amDeck) != -1);
        this.editionConditions = gameManager.conditions(gameManager.game.edition, true).map((condition) => condition.name);
    }

    setEdition(edition: string | undefined = undefined) {
        gameManager.stateManager.before("setEdition", "data.edition." + edition);
        if (edition == 'fh') {
            settingsManager.setFhStyle(true);
        } else {
            settingsManager.setFhStyle(false);
        }
        gameManager.game.edition = edition;
        gameManager.game.party.edition = edition;
        this.editionConditions = gameManager.conditions(gameManager.game.edition, true).map((condition) => condition.name);
        gameManager.stateManager.after();
    }

    toggleCampaignMode() {
        gameManager.stateManager.before(gameManager.game.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
        gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
        gameManager.stateManager.after();
    }

    toggleCondition(condition: ConditionName) {
        if (this.editionConditions.indexOf(condition) == -1) {
            gameManager.stateManager.before(gameManager.game.conditions.indexOf(condition) == -1 ? 'addGameCondition' : 'removeGameCondition', condition);
            if (gameManager.game.conditions.indexOf(condition) == -1) {
                gameManager.game.conditions.push(condition);
            } else {
                gameManager.game.conditions = gameManager.game.conditions.filter((conditionName) => condition != conditionName);
            }
            gameManager.stateManager.after();
        }
    }

    openCharacterSheet(character: Character) {
        this.dialog.open(CharacterSheetDialog, {
            panelClass: ['dialog-invert'],
            data: character
        });
        this.close.emit();
    }

    openPartySheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: { partySheet: true }
        });
        this.close.emit();
    }

    openCampaignSheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: { campaign: true }
        });
        this.close.emit();
    }

    openBattleGoalsSetup() {
        this.dialog.open(BattleGoalSetupDialog, {
            panelClass: ['dialog']
        });
        this.close.emit();
    }

    openItems() {
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: {
                edition: gameManager.game.edition
            }
        });
        this.close.emit();
    }


    addParty() {
        let party = new Party();
        let id = 0;
        while (gameManager.game.parties.some((party) => party.id == id)) {
            id++;
        }
        party.id = id;
        gameManager.stateManager.before("addParty", party.name || '%party% ' + party.id);
        gameManager.game.parties.push(party);
        this.changeParty(party);
        this.update();
        gameManager.stateManager.after();
    }

    changeParty(party: Party) {
        gameManager.stateManager.before("changeParty", party.name || '%party% ' + party.id);
        gameManager.changeParty(party);
        this.update();
        gameManager.stateManager.after();
    }

    setName(event: any) {
        if (gameManager.game.party.name != event.target.value) {
            gameManager.stateManager.before("setPartyName", event.target.value);
            gameManager.game.party.name = event.target.value;
            gameManager.stateManager.after();
        }
    }
}